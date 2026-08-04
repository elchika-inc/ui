import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "ui-scaffold";

import { type MouseEvent, useState } from "react";


const pages = [1, 2, 3] as const;
const lastPage = 8;

export function Overview() {
  const [currentPage, setCurrentPage] = useState(1);
  const visiblePages =
    currentPage > pages[pages.length - 1] && currentPage < lastPage
      ? [...pages, currentPage]
      : pages;

  const selectPage = (page: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setCurrentPage(page);
  };

  return (
    <section data-slot="pagination-preview" className="flex min-h-40 w-full items-center p-6">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={`#page-${Math.max(1, currentPage - 1)}`}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
              onClick={selectPage(Math.max(1, currentPage - 1))}
            />
          </PaginationItem>
          {visiblePages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href={`#page-${page}`}
                aria-label={`${page}ページへ`}
                isActive={currentPage === page}
                onClick={selectPage(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href={`#page-${lastPage}`}
              aria-label={`${lastPage}ページへ`}
              isActive={currentPage === lastPage}
              onClick={selectPage(lastPage)}
            >
              {lastPage}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href={`#page-${Math.min(lastPage, currentPage + 1)}`}
              aria-disabled={currentPage === lastPage}
              tabIndex={currentPage === lastPage ? -1 : undefined}
              onClick={selectPage(Math.min(lastPage, currentPage + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </section>
  );
}
