<p align="center">
  <img src="https://www.uit.edu.vn/sites/vi/files/banner_uit.png" 
       width="400"/>
</p>

<h1 align="center">CS523 - CẤU TRÚC DỮ LIỆU VÀ GIẢI THUẬT NÂNG CAO</h1>

# EXTERNAL SORT VISUALIZER
> Xây dựng ứng dụng Web trực quan hóa thuật toán Sắp xếp ngoại **(External Sort)** sử dụng phương pháp trộn nhiều đường cân bằng **(Balanced Multiway Merge Sort)** trên File nhị phân chứa các số thực có kích thước 8 Bytes.

LINK DEMO: https://cs-523-assignment1-external-sorting.vercel.app/
---
## 1. GIỚI THIỆU MÔN HỌC
| | |
|---|---|
| **Môn học** | Cấu Trúc Dữ Liệu Và Giải Thuật Nâng Cao |
| **Mã lớp** | CS523.Q21 |
| **Giảng viên** | ThS. Nguyễn Thanh Sơn |
| **Sinh viên** | Tô Quốc Thái |
| **MSSV** | 24521598 |
---

## 2. GIỚI THIỆU THUẬT TOÁN
* Sắp xếp ngoại **(External Sort)** với phương pháp trộn nhiều đường cân bằng **(Balanced Multiway Merge Sort)** hoạt động theo 2 giai đoạn chính:
  * **Giai Đoạn 1 — Tạo Run:** File Input được chia thành các Chunk có kích thước cố định và bằng nhau **(Balanced)**. Sau đó thực hiện sắp xếp từng Chunk nhỏ này trong RAM bằng các thuật toán sắp xếp nội **(Internal Sort)**. Sau khi đã sắp xếp, dữ liệu sẽ được ghi ra các File tạm trên ổ đĩa được gọi là các đường chạy **(Run)**.
  * **Giai Đoạn 2 — Trộn:** Khởi tạo Cấu trúc dữ liệu Min-Heap bằng cách lấy số đầu tiên của mỗi đường chạy **(Run)** đưa vào. Mỗi bước, số nhỏ nhất trong Heap sẽ được lấy ra và ghi vào File Output, sau đó nạp số tiếp theo từ chính đường chạy **(Run)** tương ứng vào Min-Heap để bù vào chỗ trống. Quá trình lặp lại cho đến khi tất cả các Run cạn kiệt và toàn bộ dữ liệu đã được ghi vào File Output theo thứ tự tăng dần.
* Độ phức tạp:
  * **Time Complexity:** `O(N log K)` — Với N là tổng số phần tử, K là số Run.
  * **Space Complexity:** `O(K)` — Min-Heap luôn được đảm bảo chỉ chứa K phần tử tại một thời điểm.
---

## 3. MÔ TẢ DỰ ÁN:
* **Đầu vào dữ liệu:**
    * Upload File nhị phân chứa các số thực để thực hiện sắp xếp tăng dần.
    * Tự sinh File nhị phân ngẫu nhiên (từ 10 đến 1000 số) nếu người dùng chưa có sẵn File test.
* **Tùy chỉnh thuật toán:** Chạy thuật toán External Sort với kích thước Chunk (số phần tử mỗi Run) do người dùng tự quyết định.
* **Hai chế độ hoạt động:**
    * `Visualize`: Trực quan hóa chi tiết từng bước hoạt động của thuật toán (dành cho File ≤ 10KB).
    * `Sort Only`: Tối ưu hóa hiệu năng để sắp xếp nhanh các File kích thước lớn (> 10KB).
* **Bộ điều khiển trực quan hóa:**
    * Cung cấp các nút chức năng: Play/Pause, Prev, Next, Reset để dễ dàng thao tác.
    * Thanh trượt điều chỉnh tốc độ (Speed) và thanh trượt tiến trình (Timeline) cho phép tua nhanh hoặc bỏ qua các bước theo ý muốn.
* **Bảng thống kê:** Hiển thị trực tiếp tổng số lượng Runs, số bước Merge (Merge Steps), và Thời gian thực thi (Time Elapsed) cần thiết để thực thi thuật toán.
* **Quản lý File:** Hỗ trợ dọn dẹp (Xóa) các file Runs tạm và Tải về File Output kết quả đã được sắp xếp.
---

## 4. CÔNG NGHỆ SỬ DỤNG:
| Phần | Công nghệ |
|---|---|
| **Backend** | Python 3, FastAPI, Uvicorn |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion |
| **Deploy Backend** | Render |
| **Deploy Frontend** | Vercel |
--- 

## 5. CẤU TRÚC DỰ ÁN:
```
external-sort-visualizer/
├── backend/
│   ├── main.py              # FastAPI server và các endpoints
│   ├── external_sort.py     # Thuật toán External Sort và StateTracker
│   ├── generate_data.py     # Sinh file nhị phân chứa các số thực ngẫu nhiên
│   ├── verify.py            # Kiểm tra file output đã được sắp xếp tăng dần
│   └── requirements.txt     # Các thư viện Python cần thiết cần cài đặt để triển khai dự án
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # Component chính
│   │   └── components/
│   │       ├── Visualizer.jsx             # Animation visualization
│   │       ├── UploadSection.jsx          # Upload file
│   │       └── GenerateSection.jsx        # Sinh file ngẫu nhiên
│   ├── index.html
│   └── package.json
└── data/
    ├── input.bin            # File input
    └── output.bin           # File output
```
---

##  6. GIẤY PHÉP:
Dự Án Được Thực Hiện Cho Mục Đích Học Thuật - Môn Cấu Trúc Dữ Liệu Và Giải Thuật Nâng Cao (CS523) - Trường Đại Học Công Nghệ Thông Tin ĐHQG.TPHCM (UIT).
