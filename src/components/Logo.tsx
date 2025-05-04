
import precisionLogo from "/lovable-uploads/precision.jpeg";

const Logo = () => {
    return (
        <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <img
                src={precisionLogo}
                alt="PrecisionNote"
                className="h-full w-full object-contain"
            />
        </div>
    );
}

export default Logo;