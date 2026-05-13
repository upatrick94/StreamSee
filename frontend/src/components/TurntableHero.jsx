import turntable from "../assets/turntable.svg";

function TurntableHero() {
    return (
        <section className="turntable-hero">
            <img
                src={turntable}
                alt="Turntable"
                className="turntable-image"
            />
        </section>
    );
}

export default TurntableHero;