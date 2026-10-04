import Icon from "@/components/ui/Icon";

export default function Pagination({ itemsPerPage, totalItems, currentPage, onPageChange }: {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.ceil(totalItems / itemsPerPage);
  if (pageCount <= 1) return null;
  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pageCount - 1, currentPage + 1);
  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < pageCount - 1) pages.push("ellipsis");
  if (pageCount > 1) pages.push(pageCount);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Phân trang">
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="page-button" aria-label="Trang trước"><Icon name="chevron-left" size={17} /></button>
      {pages.map((page, index) => page === "ellipsis" ? <span className="px-2 text-muted" key={`ellipsis-${index}`}>…</span> : <button type="button" key={page} onClick={() => onPageChange(page)} className={`page-button ${page === currentPage ? "page-button-active" : ""}`}>{page}</button>)}
      <button type="button" disabled={currentPage === pageCount} onClick={() => onPageChange(currentPage + 1)} className="page-button" aria-label="Trang sau"><Icon name="chevron-right" size={17} /></button>
    </nav>
  );
}
