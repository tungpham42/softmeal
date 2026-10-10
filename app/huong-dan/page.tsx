import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import { SITE_NAME } from "@/lib/seo";

const description =
  "Hướng dẫn sử dụng " +
  SITE_NAME +
  ": tìm công thức, tạo bản nháp món ăn bằng AI từ video YouTube, lên thực đơn tuần, chuẩn bị danh sách đi chợ và xem thông tin dinh dưỡng.";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng",
  description,
  alternates: { canonical: "/huong-dan" },
  openGraph: {
    title: "Hướng dẫn sử dụng",
    description,
    url: "/huong-dan",
    images: [
      {
        url: "/huong-dan.jpg",
        width: 1200,
        height: 630,
        alt: "Hướng dẫn sử dụng " + SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hướng dẫn sử dụng",
    description,
    images: ["/huong-dan.jpg"],
  },
};

type GuideSection = {
  icon: IconName;
  title: string;
  intro: string;
  steps: string[];
  action?: { label: string; href: string };
};

const sections: GuideSection[] = [
  {
    icon: "search",
    title: "Tìm món hợp với bữa ăn hôm nay",
    intro:
      "Bắt đầu từ trang chủ để tìm cảm hứng, dù bạn đã biết tên món hay chỉ có sẵn vài nguyên liệu trong bếp.",
    steps: [
      "Nhập tên món hoặc từ khóa vào ô tìm kiếm.",
      "Lọc theo nhóm món như bữa sáng, bữa trưa, bữa tối, món chay, dưỡng sinh hoặc tráng miệng.",
      "Đổi cách sắp xếp để xem công thức theo tên hoặc thời gian đăng.",
    ],
    action: { label: "Khám phá công thức", href: "/" },
  },
  {
    icon: "book",
    title: "Mở công thức và nấu từng bước",
    intro:
      "Mỗi trang công thức là một sổ tay nấu ăn: bạn có thể kiểm tra nguyên liệu, theo dõi cách làm và xem video nếu tác giả có thêm liên kết.",
    steps: [
      "Đọc phần mô tả và chuẩn bị đủ nguyên liệu trước khi bắt đầu.",
      "Đánh dấu nguyên liệu và từng bước khi đã chuẩn bị xong hoặc hoàn thành.",
      "Xem các món liên quan để tìm thêm lựa chọn cho bữa ăn.",
    ],
  },
  {
    icon: "calendar",
    title: "Lên thực đơn cho cả tuần",
    intro:
      "Trong mục Gợi ý món ăn theo tuần, hệ thống đề xuất món cho bữa sáng, trưa và tối dựa trên các công thức hiện có.",
    steps: [
      "Chuyển giữa chế độ xem theo ngày và cả tuần để dễ lên kế hoạch.",
      "Chọn món khác trong danh sách, bấm Đổi món, hoặc bỏ món chưa phù hợp.",
      "Điền các bữa còn trống hoặc tạo lại thực đơn khi muốn bắt đầu từ đầu.",
      "Thực đơn được lưu trên trình duyệt của thiết bị đang dùng; mở lại bằng cùng trình duyệt để tiếp tục.",
    ],
    action: { label: "Lên thực đơn tuần", href: "/goi-y" },
  },
  {
    icon: "list",
    title: "Tạo danh sách đi chợ từ thực đơn",
    intro:
      "Không cần chép từng nguyên liệu từ nhiều công thức. Danh sách mua sắm được tổng hợp từ những món bạn đã chọn.",
    steps: [
      "Mở tab Danh sách đi chợ trong trang gợi ý thực đơn.",
      "Chọn xem nguyên liệu cho một ngày cụ thể hoặc cho cả tuần.",
      "Tìm nguyên liệu, đánh dấu món đã mua và sao chép phần còn cần mua để mang theo.",
      "Các định lượng có đơn vị tương thích có thể được cộng gộp; hãy kiểm tra lại những dòng nguyên liệu ghi theo cách tự do.",
    ],
    action: { label: "Mở danh sách đi chợ", href: "/goi-y" },
  },
  {
    icon: "check",
    title: "Tham khảo thông tin dinh dưỡng",
    intro:
      "Nếu công thức có dữ liệu, bạn có thể xem các chỉ số như năng lượng, chất đạm, tinh bột, chất béo, chất xơ và natri.",
    steps: [
      "Mở thông tin dinh dưỡng trong trang công thức hoặc phần thực đơn.",
      "Đọc đơn vị và khẩu phần đi kèm để hiểu đúng con số.",
      "Nếu mục nào ghi chưa có dữ liệu, điều đó có nghĩa là công thức chưa cung cấp thông tin ấy — hệ thống không tự điền số liệu thay thế.",
    ],
  },
  {
    icon: "plus",
    title: "Đăng công thức hoặc tạo bản nháp bằng AI",
    intro:
      "Bạn có thể ghi lại món ăn của gia đình, thêm hình ảnh và liên kết video YouTube. AI hỗ trợ soạn bản nháp từ video để bạn tiết kiệm thời gian.",
    steps: [
      "Mở mục Thêm công thức và đăng nhập hoặc tạo tài khoản nếu được yêu cầu.",
      "Nhập tên món, mô tả, danh mục; mỗi nguyên liệu và mỗi bước nấu nên đặt trên một dòng riêng.",
      "Dán liên kết YouTube rồi chọn Tạo công thức bằng AI. Nội dung được tạo là bản nháp, chưa được đăng cho đến khi bạn chủ động lưu.",
      "Nếu máy chủ không lấy được phụ đề, hãy dán lời thoại hoặc nội dung mô tả vào ô tương ứng. Không phải video nào cũng có thể đọc phụ đề tự động.",
      "Kiểm tra kỹ định lượng, quy trình và thông tin dinh dưỡng do AI đề xuất trước khi đăng công thức.",
    ],
    action: { label: "Thêm công thức", href: "/them" },
  },
  {
    icon: "comment",
    title: "Bình luận và góp ý",
    intro:
      "Trao đổi kinh nghiệm nấu nướng giúp mọi người hiểu rõ hơn về món ăn và có thêm ý tưởng để biến tấu.",
    steps: [
      "Mở trang của món ăn rồi nhập nội dung bình luận.",
      "Bạn có thể bình luận với tên khách hoặc sử dụng tài khoản để giữ trải nghiệm nhất quán hơn.",
      "Nếu phát hiện thông tin chưa rõ hoặc gặp lỗi, hãy gửi góp ý qua trang Liên hệ.",
    ],
    action: { label: "Gửi góp ý", href: "/lien-he" },
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="hero-paper overflow-hidden rounded-[2rem] px-6 py-10 text-ivory shadow-lg sm:px-10 sm:py-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-ivory/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-gold-light">
          <Icon name="book" size={15} /> Cẩm nang sử dụng
        </span>
        <h1 className="mt-4 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Từ “hôm nay ăn gì?” đến “đi chợ mua gì?”
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/85 sm:text-lg sm:leading-8">
          {SITE_NAME} giúp bạn khám phá món ngon, sắp xếp bữa ăn, chuẩn bị
          nguyên liệu và vào bếp dễ dàng hơn — từng bước một, không cần lập
          kế hoạch trên nhiều nơi khác nhau.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/goi-y" className="btn-gold">
            <Icon name="calendar" size={17} /> Lên thực đơn tuần
          </Link>
          <Link href="/" className="btn-outline-dark">
            <Icon name="search" size={17} /> Tìm món ăn
          </Link>
          <Link href="/them" className="btn-outline-dark">
            <Icon name="youtube" size={17} /> Tạo công thức bằng AI
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-gold/30 bg-gold/10 p-6 sm:p-8" aria-labelledby="ai-recipe-title">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/25 text-lacquer">
            <Icon name="youtube" size={23} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="eyebrow">
              <Icon name="refresh" size={15} /> Công cụ hỗ trợ bằng AI
            </span>
            <h2 id="ai-recipe-title" className="mt-2 font-serif text-2xl font-bold text-lacquer sm:text-3xl">
              Tạo công thức bằng AI từ video YouTube
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Dán đường dẫn video để AI hỗ trợ soạn tiêu đề, mô tả, nguyên liệu,
              các bước chế biến và thông tin dinh dưỡng khi có dữ liệu phù hợp.
              Nếu máy chủ không lấy được phụ đề, bạn có thể dán lời thoại hoặc
              nội dung mô tả vào ô ghi chú để làm nguồn tham khảo.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              Kết quả chỉ là bản nháp trong biểu mẫu, không tự động đăng. Hãy
              kiểm tra nguồn, định lượng, cách nấu và các ước tính dinh dưỡng
              trước khi lưu; AI không thể bảo đảm mọi chi tiết trong video đều
              được trích xuất chính xác.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/them" className="btn-primary">
                <Icon name="refresh" size={17} /> Bắt đầu tạo công thức
              </Link>
              <Link href="/them" className="btn-secondary">
                <Icon name="plus" size={17} /> Tự nhập công thức
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="guide-sections-title">
        <div className="mb-6">
          <span className="eyebrow">
            <Icon name="route" size={15} /> Hướng dẫn từng bước
          </span>
          <h2 id="guide-sections-title" className="section-title">
            Dùng {SITE_NAME} theo cách của bạn
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
            Bạn không cần làm theo thứ tự. Hãy mở đúng tính năng đang cần:
            tìm một món nhanh, chuẩn bị bữa tối hay lên kế hoạch cho cả tuần.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"
            >
              <div className="flex items-start gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-lacquer sm:size-12">
                  <Icon name={section.icon} size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-muted">
                    Bước {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-serif text-xl font-bold text-lacquer sm:text-2xl">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {section.intro}
                  </p>
                  <ol className="mt-4 space-y-3">
                    {section.steps.map((step, stepIndex) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 text-sm leading-7 text-ink"
                      >
                        <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-cream text-xs font-bold text-lacquer">
                          {stepIndex + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {section.action && (
                    <div className="mt-5">
                      <Link
                        href={section.action.href}
                        className="inline-flex items-center gap-1 text-sm font-bold text-lacquer underline decoration-gold underline-offset-4 hover:decoration-2"
                      >
                        {section.action.label}
                        <Icon name="chevron-right" size={16} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-gold/30 bg-gold/10 p-6 sm:p-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl font-bold text-lacquer sm:text-3xl">
              Chưa tìm được câu trả lời?
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Gửi câu hỏi hoặc góp ý để chúng tôi biết điều gì có thể làm cho
              trải nghiệm nấu ăn của bạn thuận tiện hơn.
            </p>
          </div>
          <Link href="/lien-he" className="btn-primary shrink-0 justify-center">
            <Icon name="mail" size={17} /> Liên hệ hỗ trợ
          </Link>
        </div>
      </section>
    </div>
  );
}
