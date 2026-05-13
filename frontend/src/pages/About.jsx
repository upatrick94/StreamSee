import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import "../styles/about.css";

function About() {
    return (
        <div className="about-page page-fade">
            <Navbar activePage="about" />
            <Hero />
            <Footer />
        </div>
    );
}

export default About;