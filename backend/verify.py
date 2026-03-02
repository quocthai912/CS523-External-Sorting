import struct
import os

DOUBLE_SIZE = 8


# Hàm được dùng để đọc toàn bộ số trong từng File Input và Output
def read_all(filepath: str) -> list[float]:
    numbers = []
    with open(filepath, "rb") as f:
        while True:
            raw = f.read(DOUBLE_SIZE)
            if not raw:
                break
            numbers.append(struct.unpack("d", raw)[0])
    return numbers


base = os.path.dirname(__file__)

# Đọc file input và output
input_nums = read_all(os.path.join(base, "..", "data", "input.bin"))
output_nums = read_all(os.path.join(base, "..", "data", "output.bin"))

print(f"Số lượng input : {len(input_nums)}")
print(f"Số lượng output: {len(output_nums)}")

# Kiểm tra các số đã được sắp xếp hay chưa
is_sorted = all(
    output_nums[i] <= output_nums[i + 1] for i in range(len(output_nums) - 1)
)

print(f"\n5 số đầu input : {[round(x,2) for x in input_nums[:5]]}")
print(f"5 số đầu output: {[round(x,2) for x in output_nums[:5]]}")
print(f"5 số cuối output: {[round(x,2) for x in output_nums[-5:]]}")

if is_sorted:
    print("\nThuật toán hoàn thành! File output đã được sắp xếp tăng dần!")
else:
    print("\nPhát hiện lỗi! File output chưa được sắp xếp chính xác")
