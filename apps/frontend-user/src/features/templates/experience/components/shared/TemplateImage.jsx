import InvitationLabel from '@/features/templates/shared/InvitationLabel';
import { useEffect, useState } from "react";
import { safeIntroMedia } from '@/features/templates/shared/cinematicIntro';
import { IoImageOutline } from "react-icons/io5";

export default function TemplateImage({ src, alt, className, loading = "lazy", ...props }) {
    const source = safeIntroMedia(src);
    const [failed, setFailed] = useState(!source);

    useEffect(() => {
        setFailed(!source);
    }, [source]);

    if (!source || failed) {
        return (
            <span className={`tx-image-fallback${className ? ` ${className}` : ""}`} role="img" aria-label={alt}>
                <IoImageOutline aria-hidden="true" />
                <small><InvitationLabel value={"រូបភាពអនុស្សាវរីយ៍"} /></small>
            </span>
        );
    }

    return (
        <img
            alt={alt}
            className={className}
            loading={loading}
            onError={() => setFailed(true)}
            {...props}
            src={source}
        />
    );
}
