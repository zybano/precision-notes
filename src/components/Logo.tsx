
import precisionLogo from "/lovable-uploads/precision.jpeg";

const Logo = () => {

    return (
        <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <a href="/" target="_self" rel="noreferrer">
                <img
                    src={precisionLogo}
                    alt="PrecisionNote"
                    className="h-full w-full object-contain"
                />
            </a>
        </div>
    );
}

export default Logo;