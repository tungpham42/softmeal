import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import { SITE_NAME } from "@/lib/seo";

const description =
  "Bếp nhà Quỳnh là nơi lưu giữ và chia sẻ công thức, gợi ý bữa ăn và những câu chuyện quanh mâm cơm Việt.";

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
        url: "/1200x630.jpg",
        width: 1200,
        height: 630,
        alt: `Giới thiệu ${SITE_NAME}`,
      },
    ],
  },
};

const values: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "heart",
    title: "Giữ hồn món Việt",
    text: "Mỗi công thức là một mẩu ký ức của gian bếp gia đình. Chúng tôi ưu tiên hương vị truyền thống và cách nấu gần gũi, dễ làm tại nhà.",
  },
  {
    icon: "user",
    title: "Của cộng đồng",
    text: "Ai cũng có thể đóng góp món ruột của mình. Mỗi lượt chia sẻ và bình luận giúp kho công thức thêm phong phú.",
  },
  {
    icon: "check",
    title: "Rõ ràng, dễ theo",
    text: "Nguyên liệu và từng bước được trình bày tách bạch, kèm hình ảnh và video, để người mới vào bếp cũng yên tâm làm theo.",
  },
];

const features: {
  icon: IconName;
  title: string;
  text: string;
  href: string;
}[] = [
  {
    icon: "search",
    title: "Tìm món theo ý muốn",
    text: "Tìm theo tên món hoặc nguyên liệu, lọc theo bữa sáng, trưa, tối, món chay và tráng miệng.",
    href: "/",
  },
  {
    icon: "calendar",
    title: "Gợi ý theo tuần",
    text: "Không biết hôm nay nấu gì? Xem thực đơn gợi ý cho cả tuần để lên kế hoạch đi chợ.",
    href: "/goi-y",
  },
  {
    icon: "plus",
    title: "Chia sẻ công thức",
    text: "Đăng món ruột của bạn cùng hình ảnh, nguyên liệu và các bước thực hiện.",
    href: "/them",
  },
  {
    icon: "book",
    title: "Hướng dẫn sử dụng",
    text: "Làm quen nhanh với cách tìm món, tạo tài khoản và tham gia cộng đồng.",
    href: "/huong-dan",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      {/* Hero */}
      <section className="hero-paper overflow-hidden rounded-[2rem] px-6 py-12 text-ivory shadow-lg sm:px-10 sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-ivory/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-gold-light">
          <Icon name="bowl" size={15} /> Về chúng tôi
        </span>
        <h1 className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {SITE_NAME} — món ăn &amp; ký ức
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-ivory/85 sm:text-lg">
          Một góc bếp trực tuyến để lưu giữ những món ngon, chia sẻ công thức và
          kể lại câu chuyện quanh mâm cơm Việt.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-gold">
            <Icon name="search" size={17} /> Khám phá công thức
          </Link>
          <Link href="/lien-he" className="btn-outline-dark">
            <Icon name="mail" size={17} /> Liên hệ với chúng tôi
          </Link>
        </div>
      </section>

      {/* Story */}
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <span className="eyebrow">
          <Icon name="book" size={15} /> Câu chuyện
        </span>
        <h2 className="section-title">
          Từ gian bếp nhỏ đến cộng đồng yêu nấu ăn
        </h2>
        <div className="prose-viet mt-4 space-y-4">
          <p>
            Bữa cơm gia đình luôn là nơi những công thức được truyền từ người
            này sang người khác, thường chỉ bằng lời kể và &ldquo;nêm vừa
            miệng&rdquo;. Những món ấy dễ bị thất lạc theo thời gian.
          </p>
          <p>
            {SITE_NAME} ra đời để ghi lại chúng một cách cẩn thận: nguyên liệu
            rõ ràng, từng bước dễ theo, kèm hình ảnh thật. Từ đó, bất kỳ ai cũng
            có thể nấu lại hương vị quen thuộc hoặc tìm cảm hứng cho bữa ăn hôm
            nay.
          </p>
          <p>
            Chúng tôi tin rằng nấu ăn không chỉ là chuyện no bụng, mà còn là
            cách để kết nối mọi người với nhau.
          </p>
        </div>
      </section>

      {/* Values */}
      <section>
        <div className="mb-6">
          <span className="eyebrow">
            <Icon name="heart" size={15} /> Giá trị
          </span>
          <h2 className="section-title">Điều chúng tôi theo đuổi</h2>
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

      {/* Features */}
      <section>
        <div className="mb-6">
          <span className="eyebrow">
            <Icon name="list" size={15} /> Trải nghiệm
          </span>
          <h2 className="section-title">Bạn có thể làm gì tại đây</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-lacquer/30"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-lacquer">
                <Icon name={item.icon} size={20} />
              </div>
              <div>
                <h3 className="flex items-center gap-1 font-serif text-lg font-bold text-lacquer">
                  {item.title}
                  <Icon
                    name="chevron-right"
                    size={16}
                    className="transition group-hover:translate-x-1"
                  />
                </h3>
                <p className="mt-1 text-sm leading-7 text-muted">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[2rem] border border-gold/30 bg-gold/10 p-6 text-center sm:p-10">
        <h2 className="font-serif text-2xl font-bold text-lacquer sm:text-3xl">
          Có món ngon muốn chia sẻ, hay muốn hợp tác cùng chúng tôi?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted">
          Mọi góp ý, câu hỏi và đề xuất hợp tác đều được chào đón. Hãy để lại
          lời nhắn, chúng tôi sẽ phản hồi sớm nhất có thể.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/lien-he" className="btn-primary">
            <Icon name="mail" size={17} /> Liên hệ ngay
          </Link>
          <Link href="/dang-ky" className="btn-secondary">
            <Icon name="user-plus" size={17} /> Tham gia cộng đồng
          </Link>
        </div>
      </section>
    </div>
  );
}
