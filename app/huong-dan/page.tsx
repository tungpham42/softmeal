import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng",
  description:
    "Hướng dẫn nhanh để tìm món, chia sẻ công thức và tham gia cộng đồng.",
  openGraph: {
    title: "Hướng dẫn sử dụng",
    description:
      "Hướng dẫn nhanh để tìm món, chia sẻ công thức và tham gia cộng đồng.",
    images: [
      {
        url: "/huong-dan.jpg",
        width: 1200,
        height: 630,
        alt: "Hướng dẫn nhanh để tìm món, chia sẻ công thức và tham gia cộng đồng.",
      },
    ],
  },
};
const sections = [
  {
    title: "Bắt đầu",
    icon: "book" as const,
    text: "Bếp nhà Quỳnh là nơi bạn có thể khám phá công thức, lấy ý tưởng cho bữa ăn và chia sẻ món ruột của gia đình.",
  },
  {
    title: "Tạo tài khoản",
    icon: "user-plus" as const,
    text: "Chọn Đăng ký và dùng email/mật khẩu, tài khoản Google, Facebook, hoặc ẩn danh. Sau khi đăng ký, bạn có thể bình luận và thêm công thức.",
  },
  {
    title: "Khám phá công thức",
    icon: "search" as const,
    text: "Trên trang chủ, nhập tên món hoặc nguyên liệu; lọc theo Bữa sáng, Bữa trưa, Bữa tối, Món chay và Tráng miệng và sắp xếp theo tên hoặc ngày.",
  },
  {
    title: "Chia sẻ công thức",
    icon: "plus" as const,
    text: "Vào Thêm công thức, nhập nguyên liệu và từng bước theo từng dòng. Ảnh món ăn được đưa lên Cloudinary và công thức được lưu vào Firestore.",
  },
  {
    title: "Bình luận",
    icon: "comment" as const,
    text: "Bạn cần đăng nhập để bình luận. Tên hiển thị được đồng bộ vào các bình luận cũ khi bạn đổi tên người dùng.",
  },
];
export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <span className="eyebrow">
          <Icon name="book" size={15} /> Cẩm nang
        </span>
        <h1 className="section-title">Cách sử dụng Bếp nhà Quỳnh</h1>
        <p className="mt-2 text-sm text-muted">
          Hướng dẫn nhanh để tìm món, chia sẻ công thức và tham gia cộng đồng.
        </p>
      </div>
      <div className="space-y-4">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-lacquer">
                <Icon name={section.icon} size={20} />
              </div>
              <div>
                <div className="mb-1 text-xs font-extrabold uppercase tracking-wider text-muted">
                  0{index + 1}
                </div>
                <h2 className="font-serif text-2xl font-bold text-lacquer">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {section.text}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
