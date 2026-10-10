import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import { SITE_NAME } from "@/lib/seo";

const description =
  SITE_NAME +
  " giúp bạn khám phá công thức món ăn, tạo bản nháp công thức bằng AI từ video YouTube, lên thực đơn tuần, chuẩn bị danh sách đi chợ và lưu giữ những câu chuyện quanh mâm cơm Việt.";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description,
  alternates: { canonical: "/gioi-thieu" },
  openGraph: {
    title: "Giới thiệu",
    description,
    url: "/gioi-thieu",
    images: [
      {
        url: "/gioi-thieu.jpg",
        width: 1200,
        height: 630,
        alt: "Giới thiệu " + SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Giới thiệu",
    description,
    images: ["/gioi-thieu.jpg"],
  },
};

type Feature = {
  icon: IconName;
  title: string;
  text: string;
  href: string;
  linkLabel: string;
};

type Value = {
  icon: IconName;
  title: string;
  text: string;
};

const values: Value[] = [
  {
    icon: "heart",
    title: "Đưa món ăn gia đình đến gần nhau hơn",
    text: "Công thức quen thuộc thường được truyền bằng lời kể và kinh nghiệm. Ghi lại nguyên liệu, cách làm và câu chuyện phía sau giúp những món ngon dễ được nấu lại và chia sẻ hơn.",
  },
  {
    icon: "route",
    title: "Thiết thực từ lúc chọn món đến khi vào bếp",
    text: "Tìm công thức chỉ là bước đầu. Thực đơn tuần và danh sách đi chợ giúp bạn nối việc chọn món với chuẩn bị nguyên liệu, thay vì phải tự ghép mọi thứ ở nhiều nơi.",
  },
  {
    icon: "check",
    title: "Rõ ràng về thông tin",
    text: "Nguyên liệu và các bước được trình bày riêng để dễ theo dõi. Dữ liệu dinh dưỡng chỉ hiển thị khi công thức có cung cấp; nội dung do AI soạn cần được người dùng kiểm tra trước khi đăng.",
  },
];

const features: Feature[] = [
  {
    icon: "search",
    title: "Khám phá công thức",
    text: "Tìm theo tên món, duyệt theo nhóm bữa ăn và mở hướng dẫn chi tiết để chuẩn bị món phù hợp với gia đình.",
    href: "/",
    linkLabel: "Tìm món ăn",
  },
  {
    icon: "calendar",
    title: "Lên thực đơn và danh sách đi chợ",
    text: "Sắp xếp bữa sáng, trưa, tối cho 7 ngày; đổi món theo ý thích, tổng hợp nguyên liệu và đánh dấu món đã mua.",
    href: "/goi-y",
    linkLabel: "Lên kế hoạch tuần",
  },
  {
    icon: "book",
    title: "Nấu theo từng bước",
    text: "Theo dõi nguyên liệu và cách làm, xem video nếu có, tham khảo thông tin dinh dưỡng được cung cấp và tìm món liên quan.",
    href: "/huong-dan",
    linkLabel: "Xem hướng dẫn",
  },
  {
    icon: "youtube",
    title: "Tạo công thức bằng AI",
    text: "Dán link video YouTube để AI hỗ trợ soạn tiêu đề, mô tả, nguyên liệu và các bước nấu thành bản nháp. Nếu không lấy được phụ đề, bạn có thể bổ sung lời thoại hoặc nội dung mô tả; hãy kiểm tra kỹ trước khi lưu.",
    href: "/them",
    linkLabel: "Tạo bản nháp bằng AI",
  },
  {
    icon: "plus",
    title: "Ghi lại món ngon của bạn",
    text: "Tự nhập công thức kèm ảnh, nguyên liệu, từng bước và video YouTube để lưu giữ món ruột hoặc chia sẻ kinh nghiệm nấu ăn với cộng đồng.",
    href: "/them",
    linkLabel: "Tự thêm công thức",
  },
  {
    icon: "check",
    title: "Tham khảo dinh dưỡng",
    text: "Xem thông tin về năng lượng, chất đạm, tinh bột, chất béo, chất xơ và các chỉ số khác khi công thức có cung cấp dữ liệu. Giúp bạn có thêm thông tin để cân nhắc món ăn và khẩu phần phù hợp.",
    href: "/",
    linkLabel: "Khám phá món ăn",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <section className="hero-paper overflow-hidden rounded-[2rem] px-6 py-12 text-ivory shadow-lg sm:px-10 sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-ivory/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-gold-light">
          <Icon name="bowl" size={15} /> Về {SITE_NAME}
        </span>
        <h1 className="mt-4 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Không chỉ hỏi “hôm nay ăn gì?” — cùng chuẩn bị một bữa cơm trọn vẹn
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/85 sm:text-lg sm:leading-8">
          {SITE_NAME} là góc bếp trực tuyến để khám phá món ngon, lưu giữ công
          thức, lên thực đơn và chuẩn bị danh sách đi chợ. Mục tiêu rất gần gũi:
          giúp việc quyết định nấu gì mỗi ngày bớt rối, còn thời gian dành cho
          điều quan trọng hơn — bữa ăn và những người cùng thưởng thức.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-gold">
            <Icon name="search" size={17} /> Khám phá công thức
          </Link>
          <Link href="/them" className="btn-outline-dark">
            <Icon name="youtube" size={17} /> Tạo công thức bằng AI
          </Link>
          <Link href="/lien-he" className="btn-outline-dark">
            <Icon name="mail" size={17} /> Liên hệ với chúng tôi
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <span className="eyebrow">
          <Icon name="book" size={15} /> Câu chuyện
        </span>
        <h2 className="section-title">Một nơi cho cả hành trình bữa ăn</h2>
        <div className="prose-viet mt-4 space-y-4">
          <p>
            Có những ngày ta biết mình muốn ăn ngon nhưng chưa nghĩ ra món gì.
            Có ngày đã chọn được món nhưng lại quên mất cần mua những nguyên
            liệu nào. Và đôi khi, công thức gia đình chỉ nằm trong trí nhớ hoặc
            một đoạn tin nhắn cũ.
          </p>
          <p>
            {SITE_NAME} được định hướng để nối các việc ấy thành một hành trình
            đơn giản: khám phá công thức, xem cách nấu, chọn món cho từng bữa,
            gom nguyên liệu thành danh sách đi chợ và tham khảo thông tin dinh
            dưỡng khi có dữ liệu. Bạn cũng có thể ghi lại món ruột của mình để
            người khác tìm thấy và thử nấu.
          </p>
          <p>
            Chúng tôi tin rằng công nghệ nên làm việc bếp núc dễ dàng hơn, chứ
            không thay thế khẩu vị, kinh nghiệm hay sự sáng tạo của người nấu.
            Một công thức tốt vẫn cần được trình bày rõ ràng, kiểm tra cẩn thận
            và điều chỉnh theo nguyên liệu thực tế.
          </p>
        </div>
      </section>

      <section
        className="rounded-[2rem] border border-gold/30 bg-gold/10 p-6 sm:p-8"
        aria-labelledby="about-ai-title"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/25 text-lacquer">
            <Icon name="youtube" size={23} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="eyebrow">
              <Icon name="refresh" size={15} /> Tiện ích nổi bật
            </span>
            <h2
              id="about-ai-title"
              className="mt-2 font-serif text-2xl font-bold text-lacquer sm:text-3xl"
            >
              Biến video nấu ăn thành bản nháp công thức với AI
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Không cần bắt đầu từ trang giấy trắng: nhập link YouTube để AI hỗ
              trợ phác thảo mô tả món ăn, nguyên liệu và các bước chế biến. Bạn
              cũng có thể dán lời thoại hoặc mô tả thủ công khi phụ đề không
              truy cập được.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              Nội dung tạo ra chưa được đăng tự động. Người nấu vẫn là người
              quyết định cuối cùng: hãy kiểm tra định lượng, độ hợp lý của các
              bước và thông tin dinh dưỡng trước khi lưu công thức.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/them" className="btn-primary">
                <Icon name="refresh" size={17} /> Tạo công thức bằng AI
              </Link>
              <Link href="/huong-dan" className="btn-secondary">
                <Icon name="book" size={17} /> Xem hướng dẫn sử dụng
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-values-title">
        <div className="mb-6">
          <span className="eyebrow">
            <Icon name="heart" size={15} /> Điều chúng tôi coi trọng
          </span>
          <h2 id="about-values-title" className="section-title">
            Gần gũi, hữu ích và minh bạch
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {values.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-gold/15 text-lacquer">
                <Icon name={item.icon} size={20} />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-lacquer">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-features-title">
        <div className="mb-6">
          <span className="eyebrow">
            <Icon name="list" size={15} /> Bạn có thể làm gì
          </span>
          <h2 id="about-features-title" className="section-title">
            Các công cụ cho căn bếp mỗi ngày
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
            Mỗi tính năng giải quyết một việc cụ thể — từ tìm cảm hứng đến chuẩn
            bị nguyên liệu và chia sẻ kinh nghiệm nấu nướng.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-lacquer/30 sm:p-6"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-lacquer">
                <Icon name={item.icon} size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="flex items-start gap-1 font-serif text-lg font-bold text-lacquer">
                  <span>{item.title}</span>
                  <Icon
                    name="chevron-right"
                    size={16}
                    className="mt-1 shrink-0 transition group-hover:translate-x-1"
                  />
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
                <span className="mt-3 inline-flex items-center text-sm font-bold text-lacquer underline decoration-gold underline-offset-4">
                  {item.linkLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-gold/30 bg-gold/10 p-6 text-center sm:p-10">
        <h2 className="font-serif text-2xl font-bold text-lacquer sm:text-3xl">
          Cùng làm cho kho công thức thêm phong phú
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted">
          Hãy chia sẻ món ăn bạn tâm đắc, gửi góp ý về trải nghiệm hoặc kết nối
          với chúng tôi nếu có ý tưởng hợp tác. Những đóng góp thiết thực giúp{" "}
          {SITE_NAME} ngày càng hữu ích hơn cho người yêu nấu ăn.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/them" className="btn-primary">
            <Icon name="youtube" size={17} /> Tạo công thức bằng AI
          </Link>
          <Link href="/them" className="btn-secondary">
            <Icon name="plus" size={17} /> Tự thêm công thức
          </Link>
          <Link href="/lien-he" className="btn-secondary">
            <Icon name="mail" size={17} /> Gửi lời nhắn
          </Link>
        </div>
      </section>
    </div>
  );
}
