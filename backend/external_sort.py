import struct
import os

# Kích thước 1 số double = 8 Bytes
DOUBLE_SIZE = 8


def read_chunk(file, chunk_size: int) -> list[float]:
    """
    Đọc tối đa chunk_size số từ file nhị phân
    Trả về 1 danh sách (list) các số thực (float/double)
    """
    numbers = []
    for _ in range(chunk_size):
        # Đọc lần lượt từng số
        raw = file.read(DOUBLE_SIZE)
        # Hết File
        if not raw:
            break
        # Chuyển đổi dữ liệu nhị phân trở lại số ban đầu
        number = struct.unpack("d", raw)[0]
        numbers.append(number)
    return numbers


class StateTracker:
    """
    Ghi lại toàn bộ các bước của thuật toán External Sort
    Mỗi bước, ta xem như một sự kiện của thuật toán và lưu vào danh sách sự kiện (events)
    """

    # Constructor
    def __init__(self):
        self.events = []  # Danh sách tất cả sự kiện
        self.step = 0  # Đếm số bước

    def log(self, event_type: str, description: str, data: dict = {}):
        """
        Hàm được dùng để ghi 1 sự kiện vào danh sách
        event_type: Loại sự kiện (Load, Sort, Merge, Write)
        description: mô tả sự kiện
        data: dữ liệu kèm theo
        """
        # Mỗi khi một sự kiện xảy ra, ta tăng 1 bước
        self.step += 1
        # Khởi tạo một dictionary event lưu trữ theo key-value
        event = {
            "step": self.step,
            "type": event_type,
            "description": description,
            "data": data,
        }

        self.events.append(event)
        print(f"Bước {self.step} [{event_type}]: {description}")

    def get_trace(self) -> dict:
        """Trả về toàn bộ trace để xuất ra file JSON"""
        return {
            # Tổng số bước chạy
            "total_steps": self.step,
            # Các sự kiện
            "events": self.events,
        }


def create_runs(
    input_path: str, run_dir: str, chunk_size: int, tracker: StateTracker
) -> list[str]:
    """
    Giai đoạn 1: Đọc file input đầu vào và chia thành các chunk nhỏ,
    Sort từng chunk bằng Internal Sort và lưu ra các File tạm gọi là Run
    Trả về danh sách đường dẫn các file run.
    """
    # Tạo thư mục chứa các file run (Chunk đã sắp xếp)
    os.makedirs(run_dir, exist_ok=True)
    # Danh sách chứa đường dẫn các file run
    run_files = []
    # Chỉ số Index của run
    run_index = 0
    # Ghi lại sự kiện
    tracker.log(
        "START",
        "Start Phase 1: Create Runs",
        {"input": input_path, "chunk_size": chunk_size},
    )
    # Đọc các chunk từ file input đầu vào
    with open(input_path, "rb") as f:
        while True:
            # Đọc 1 chunk từ File
            chunk = read_chunk(f, chunk_size)
            if not chunk:
                break  # Hết File
            # Lưu bản gốc trước khi Sort để Visualize
            orginal_chunk = chunk[:]
            # Ghi lại sự kiện
            tracker.log(
                "LOAD",
                f"Load Chunk {run_index + 1} Into RAM",
                {"run_index": run_index + 1, "numbers": orginal_chunk},
            )

            # Dùng Internal Sort để Sort Chunk tăng dần trong RAM
            chunk.sort()
            # Ghi lại sự kiện
            tracker.log(
                "SORT",
                f"Chunk {run_index + 1} Sorted In RAM",
                {"run_index": run_index + 1, "numbers": chunk},
            )

            # Thực hiện tạo file run để ghi dữ liệu chunk đã sắp xếp
            run_path = os.path.join(run_dir, f"run_{run_index}.bin")
            with open(run_path, "wb") as run_file:
                # Tiến hành ghi từng số trong chunk vào run
                for num in chunk:
                    run_file.write(struct.pack("d", num))
            tracker.log(
                "WRITE",
                f"Run {run_index + 1} Written To Disk",
                {"run_index": run_index + 1, "run_path": run_path},
            )
            # Lưu đường dẫn tới File run vừa tạo vào danh sách
            run_files.append(run_path)
            run_index += 1
    # Hoàn thành tạo các Run
    tracker.log(
        "END_PHASE1",
        f"Phase 1 Complete — {len(run_files)} Runs Created",
        {"total_runs": len(run_files), "run_files": run_files},
    )

    return run_files


def merge_runs(run_files: list[str], output_path: str, tracker: StateTracker):
    """
    Giai đoạn 2: Merge tất cả các Run đã sort thành 1 file kết quả.
    Log chi tiết từng bước để Frontend visualization.
    """
    import heapq

    # Đọc toàn bộ nội dung các run vào memory để visualization
    runs_data = []
    for run_path in run_files:
        nums = []
        with open(run_path, "rb") as f:
            while True:
                raw = f.read(DOUBLE_SIZE)
                if not raw:
                    break
                nums.append(struct.unpack("d", raw)[0])
        runs_data.append(nums)

    tracker.log(
        "START_PHASE2",
        "Start Phase 2: Merge The Runs",
        {
            "run_files": run_files,
            "runs_data": runs_data,  # Toàn bộ dữ liệu các run
            "output": output_path,
        },
    )

    # Mở tất cả file run cùng lúc
    file_handles = [open(r, "rb") for r in run_files]

    # Khởi tạo heap: (số, index_run)
    heap = []
    run_pointers = [0] * len(run_files)  # Con trỏ vị trí trong mỗi run

    for i, fh in enumerate(file_handles):
        raw = fh.read(DOUBLE_SIZE)
        if raw:
            num = struct.unpack("d", raw)[0]
            heapq.heappush(heap, (num, i))

    tracker.log(
        "INIT_HEAP",
        "Heap Initialized With First Element Of Each Run",
        {
            "heap_state": [{"value": x[0], "from_run": x[1] + 1} for x in heap],
            "runs_data": runs_data,
            "run_pointers": run_pointers[:],
        },
    )

    output = []
    while heap:
        smallest, run_idx = heapq.heappop(heap)
        output.append(smallest)
        run_pointers[run_idx] += 1

        raw = file_handles[run_idx].read(DOUBLE_SIZE)
        if raw:
            next_num = struct.unpack("d", raw)[0]
            heapq.heappush(heap, (next_num, run_idx))

        tracker.log(
            "MERGE",
            f"Get {smallest:.2f} From Run {run_idx + 1} → Output",
            {
                "value": smallest,
                "from_run": run_idx,
                "heap_state": [{"value": x[0], "from_run": x[1] + 1} for x in heap],
                "runs_data": runs_data,
                "run_pointers": run_pointers[:],
                "output_so_far": output[:],
            },
        )

    # Ghi output ra file
    with open(output_path, "wb") as out:
        for num in output:
            out.write(struct.pack("d", num))

    for fh in file_handles:
        fh.close()

    tracker.log(
        "END_PHASE2",
        f"Phase 2 Complete — {len(output)} Numbers Merged",
        {"output": output_path, "total_written": len(output), "runs_data": runs_data},
    )


import json


def external_sort(input_path: str, output_path: str, chunk_size: int = 10) -> dict:
    """
    Hàm chính: Chạy toàn bộ thuật toán External Sort.
    """
    tracker = StateTracker()
    run_dir = os.path.join(os.path.dirname(input_path), "runs")

    # Giai đoạn 1
    run_files = create_runs(input_path, run_dir, chunk_size, tracker)

    # Giai đoạn 2
    merge_runs(run_files, output_path, tracker)

    # Đọc toàn bộ output để hiển thị kết quả
    final_output = []
    with open(output_path, "rb") as f:
        while True:
            raw = f.read(DOUBLE_SIZE)
            if not raw:
                break
            final_output.append(struct.unpack("d", raw)[0])

    tracker.log(
        "DONE",
        f"Sort Complete. All {len(final_output)} Numbers In Ascending Order",
        {"run_files": run_files, "output": output_path, "final_output": final_output},
    )

    return tracker.get_trace()


def external_sort_only(input_path: str, output_path: str, chunk_size: int = 10) -> dict:
    """
    Hàm được sử dụng để sort các File lớn, không minh họa thuật toán bằng Animation
    """
    tracker = StateTracker()
    run_dir = os.path.join(os.path.dirname(input_path), "runs")

    os.makedirs(run_dir, exist_ok=True)
    run_files = []
    run_index = 0

    # Phase 1: Tạo runs
    with open(input_path, "rb") as f:
        while True:
            chunk = read_chunk(f, chunk_size)
            if not chunk:
                break
            chunk.sort()
            run_path = os.path.join(run_dir, f"run_{run_index}.bin")
            with open(run_path, "wb") as run_file:
                for num in chunk:
                    run_file.write(struct.pack("d", num))
            run_files.append(run_path)
            run_index += 1

    # Phase 2: Merge runs
    import heapq

    file_handles = [open(r, "rb") for r in run_files]
    heap = []

    for i, fh in enumerate(file_handles):
        raw = fh.read(DOUBLE_SIZE)
        if raw:
            num = struct.unpack("d", raw)[0]
            heapq.heappush(heap, (num, i))

    with open(output_path, "wb") as out:
        total_written = 0
        while heap:
            smallest, run_idx = heapq.heappop(heap)
            out.write(struct.pack("d", smallest))
            total_written += 1
            raw = file_handles[run_idx].read(DOUBLE_SIZE)
            if raw:
                next_num = struct.unpack("d", raw)[0]
                heapq.heappush(heap, (next_num, run_idx))

    for fh in file_handles:
        fh.close()

    # Dọn dẹp file tạm
    for f in run_files:
        os.remove(f)
    os.rmdir(run_dir)

    return {"total_runs": run_index, "total_written": total_written, "elapsed": 0}


if __name__ == "__main__":
    base = os.path.dirname(__file__)
    input_path = os.path.join(base, "..", "data", "input.bin")
    output_path = os.path.join(base, "..", "data", "output.bin")
    trace_path = os.path.join(base, "..", "data", "trace.json")

    print("Bắt đầu External Sort...\n")
    trace = external_sort(input_path, output_path, chunk_size=10)

    # Lưu trace ra file JSON
    with open(trace_path, "w", encoding="utf-8") as f:
        json.dump(trace, f, ensure_ascii=False, indent=2)

    print(f"\nHoàn Thành!")
    print(f"   File Kết Quả : data/output.bin")
    print(f"   File Trace   : data/trace.json")
    print(f"   Tổng Số Bước : {trace['total_steps']}")
