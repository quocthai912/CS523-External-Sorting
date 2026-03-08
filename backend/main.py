from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="External Sort Visualizer API")

# Cho phép React gọi API không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép vercel kết nối Frontend-Backend
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
import shutil
from fastapi import UploadFile, File
from fastapi.responses import JSONResponse

# Đường dẫn thư mục data
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Nơi xử lí Request Upload File.
    Nhận File .bin từ Frontend và lưu vào thư mục data.
    Args:
        file (UploadFile): File nhị phân được upload từ phía Frontend.
    Returns:
        dict: Tên File, kích thước File và tổng số phần tử.
    """
    # Chỉ cho phép file .bin
    if not file.filename.endswith(".bin"):
        return JSONResponse(
            status_code=400, content={"error": "Chỉ cho phép file .bin"}
        )

    save_path = os.path.join(DATA_DIR, "input.bin")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_size = os.path.getsize(save_path)
    total_numbers = file_size // 8

    return {
        "message": "Upload thành công!",
        "filename": file.filename,
        "file_size": file_size,
        "total_numbers": total_numbers,
    }


import json
import sys

sys.path.append(BASE_DIR)
from external_sort import external_sort, external_sort_only


@app.post("/sort")
async def sort_file(chunk_size: int = 10):
    """
    Nơi xử lí Request khi người dùng bấm sort có visualize.
    Hàm sẽ tiến hành gọi và chạy thuật toán External Sort trên File input.bin.
    Args:
        chunk_size (int): Kích thước cố định của mỗi Chunk.
    Returns:
        dict: Tổng số bước và toàn bộ trace data được lưu dưới dạng File JSON để trả kết quả về Frontend render animation.
    """
    input_path = os.path.join(DATA_DIR, "input.bin")
    output_path = os.path.join(DATA_DIR, "output.bin")
    trace_path = os.path.join(DATA_DIR, "trace.json")

    # Kiểm tra file input tồn tại chưa
    if not os.path.exists(input_path):
        return JSONResponse(
            status_code=400,
            content={"error": "Chưa có file input.bin! Hãy upload trước."},
        )

    # Chạy thuật toán
    trace = external_sort(input_path, output_path, chunk_size=chunk_size)

    # Lưu trace ra file JSON
    with open(trace_path, "w", encoding="utf-8") as f:
        json.dump(trace, f, ensure_ascii=False, indent=2)

    return {
        "message": "Sắp xếp thành công!",
        "total_steps": trace["total_steps"],
        "trace": trace,
    }


@app.post("/sort-only")
async def sort_file_only(chunk_size: int = 10):
    """
    Nơi nhận Request nếu File nhị phân có kích thước quá lớn hoặc người dùng thực hiện chế độ Sort Only.
    Chế độ Sort Only — Được sử dụng để sắp xếp các File có kích thước lớn.
    Args:
        chunk_size (int): Kích thước cố định của mỗi Chunk.
    Returns:
        dict: Gồm total_run: tổng số run đã tạo, total_written: số phần tử đã ghi vào output, elapsed: thời gian thực thi.
    """
    import time

    input_path = os.path.join(DATA_DIR, "input.bin")
    output_path = os.path.join(DATA_DIR, "output.bin")

    if not os.path.exists(input_path):
        return JSONResponse(
            status_code=400,
            content={"error": "No input.bin found! Please upload first."},
        )

    start = time.time()
    result = external_sort_only(input_path, output_path, chunk_size=chunk_size)
    elapsed = round(time.time() - start, 2)

    return {
        "message": "Sort Only Complete.",
        "total_runs": result["total_runs"],
        "total_written": result["total_written"],
        "elapsed": elapsed,
    }


@app.post("/cleanup")
async def cleanup_runs():
    """
    Nơi nhận Request khi người dùng xóa các File run tạm.
    Hàm sẽ xóa các File run tạm sau khi người dùng nhấn xác nhận.
    Args:
        Hàm không nhận tham số đầu vào.
    Returns:
        Backend sẽ trả về message thông báo đã xóa thành công.
    """
    import glob

    run_dir = os.path.join(DATA_DIR, "runs")

    if os.path.exists(run_dir):
        for f in glob.glob(os.path.join(run_dir, "*.bin")):
            os.remove(f)
        os.rmdir(run_dir)
        return {"message": "Đã xóa các file Run tạm!"}

    return {"message": "Không có file Run tạm nào."}


from fastapi.responses import FileResponse


@app.get("/download")
async def download_file():
    """
    Nơi nhận Request khi người dùng muốn download File output về máy.
    Args:
        Hàm không nhận tham số đầu vào.
    Returns:
        Trả về 1 Response bao gồm đường dẫn tới File output và tên File cho Frontend,
        sau đó, File sẽ tự động được tải về máy của người dùng.
    """
    output_path = os.path.join(DATA_DIR, "output.bin")

    if not os.path.exists(output_path):
        return JSONResponse(
            status_code=400,
            content={"error": "Chưa có file output.bin! Hãy chạy sắp xếp trước."},
        )

    return FileResponse(
        path=output_path,
        filename="output_sorted.bin",
        media_type="application/octet-stream",
    )


import random


@app.post("/generate")
async def generate_file(num_numbers: int = 100):
    """
    Nơi nhận Request khi người dùng muốn sử dụng chức năng generate File.
    Hàm sẽ tự sinh File nhị phân chứa các số thực ngẫu nhiên.
    Cấu trúc hàm được xây dựng dựa trên File generate_data.py trước đó.
    Args:
        num_numbers (int): Số lượng số được tạo ra.
    Returns:
        Trả về thông báo đã tạo thành công, cùng với số lượng số và kích thước của File.
    """
    if num_numbers < 10 or num_numbers > 1000:
        return JSONResponse(
            status_code=400, content={"error": "Số Lượng Phải Từ 10 Đến 1000!"}
        )

    save_path = os.path.join(DATA_DIR, "input.bin")

    import struct

    with open(save_path, "wb") as f:
        for _ in range(num_numbers):
            number = random.uniform(-10000.0, 10000.0)
            f.write(struct.pack("d", number))

    file_size = os.path.getsize(save_path)

    return {
        "message": f"Generated Successfully.",
        "num_numbers": num_numbers,
        "file_size": file_size,
    }


@app.get("/")
@app.head("/")
def root():
    """
    Các phương thức HTTP được sử dụng: GET, POST và HEAD.
    Được dùng để kiểm tra phía máy chủ (Server) có đang hoạt động không.
    Phương thức HEAD được dùng để UptimeRobot gửi request thành công và kích hoạt Server chạy 24/7.
    Args:
        Hàm này không nhận tham số đầu vào.
    Returns:
        Trả về message cho biết Server đang hoạt động.
    """
    return {"message": "External Sort API đang chạy"}
