import struct
import random
import os


def generate_binary_file(filename: str, num_numbers: int = 200):
    """Tạo File nhị phân chứa các số thực (double 8-bytes) ngẫu nhiên.
    filename: tên file được tạo ra ("input.bin")
    num_numbers: số lượng số cần tạo"""

    filepath = os.path.join(os.path.dirname(__file__), "..", "data", filename)

    # Mở File và ghi từng số vào
    with open(filepath, "wb") as f:
        for _ in range(num_numbers):
            # Khởi tạo các số thực có giá trị từ [-10000.0, 10000.0]
            number = random.uniform(-10000.0, 10000.0)
            # Chuyển sang dạng nhị phân và ghi vào File
            f.write(struct.pack("d", number))  # "d" = double 8 bytes

    # In ra các dòng lệnh để kiểm tra File đã được tạo thành công hay chưa
    print(f"Đã tạo thành công File: {filepath}")
    print(f"Số lượng số được tạo: {num_numbers}")
    print(f"Kích thước File: {os.path.getsize(filepath)} bytes")


if __name__ == "__main__":
    # Kiểm thử chương trình
    generate_binary_file("input.bin", 200)
