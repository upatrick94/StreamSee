function PickupToggle({ isExpanded, onToggle }) {
    return (
        <button
            className={`pickup-toggle ${isExpanded ? "expanded" : "collapsed"}`}
            onClick={onToggle}
            aria-label="Toggle playlist section"
            type="button"
        >
            <span className="pickup-toggle-arrow">⌄</span>
        </button>
    );
}

export default PickupToggle;