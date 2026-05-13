function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    return (
        <div className="pagination">
            <button
                type="button"
                className="pagination-arrow"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                {"<"}
            </button>

            {pages.map((page) => (
                <button
                    key={page}
                    type="button"
                    className={`pagination-page ${currentPage === page ? "active" : ""}`}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </button>
            ))}

            <button
                type="button"
                className="pagination-arrow"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                {">"}
            </button>
        </div>
    );
}

export default Pagination;