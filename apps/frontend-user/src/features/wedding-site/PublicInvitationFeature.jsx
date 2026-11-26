import { PageSkeleton } from '@/shared/ui/LoadingState';
import { guestLocale, localeContent, projectLocale } from '../templates/shared/localizedContent';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { IoHomeOutline, IoLockClosedOutline, IoSearchOutline } from "react-icons/io5";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useLanguageStore } from "@/stores/useLanguageStore";

import PublicRsvpForm from "../invitations/PublicRsvpForm";
import "../invitations/InvitationPages.css";
import TemplateExperience from "@/features/templates/experience/TemplateExperience";
import { TemplateUnavailable } from "@/features/templates/experience/TemplateRenderGuard";
import { registerDynamicTemplates } from "@/features/templates/data/templatesData";
import { templateCatalogService } from "@/features/templates/api/templateCatalogApi";
import { draftToTemplate } from "../wedding-builder/utils/draftToTemplate";
import { publicInvitationToDraft } from "../wedding-builder/utils/invitationDraftAdapter";
import { invitationService } from "@/features/invitations/api/invitationApi";
import { mediaService } from "@/features/invitations/api/mediaApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { resolveInviteToken } from "./publicInvitationQuery";
import PublicTicketAccess from "@/features/tickets/PublicTicketAccess";

function publicStateCopy(languageMode, stateType = "UNPUBLISHED") {
    const mode = String(languageMode || "").toUpperCase();
    const isEn = mode === "EN";
    const isKh = mode === "KH" || mode === "KM";

    if (stateType === "NOT_FOUND") {
        const title = isEn
            ? "Invitation unavailable"
            : isKh
                ? "រកសន្លឹកការមិនឃើញ"
                : "រកសន្លឹកការមិនឃើញ / Invitation unavailable";
        const message = isEn
            ? "This link is invalid or the invitation was removed."
            : isKh
                ? "Link មិនត្រឹមត្រូវ ឬសន្លឹកការត្រូវបានលុបចោល។"
                : "Link មិនត្រឹមត្រូវ ឬសន្លឹកការត្រូវបានលុបចោល។ This link is invalid or the invitation was removed.";
        return {
            loading: isEn ? "Loading invitation…" : isKh ? "កំពុងផ្ទុកសន្លឹកការ..." : "កំពុងផ្ទុកសន្លឹកការ... / Loading invitation…",
            title,
            message,
            unavailable: title,
            unavailableDetail: message,
            stateType: "NOT_FOUND",
        };
    }

    const title = isEn
        ? "This invitation isn't published yet"
        : isKh
            ? "សន្លឹកការមិនទាន់បានផ្សព្វផ្សាយ"
            : "សន្លឹកការមិនទាន់បានផ្សព្វផ្សាយ / Invitation unavailable";
    const message = isEn
        ? "The host has temporarily unpublished this invitation. Please check back later."
        : isKh
            ? "ម្ចាស់បានបិទការផ្សព្វផ្សាយជាបណ្តោះអាសន្ន។ សូមត្រឡប់មកម្តងទៀតនៅពេលក្រោយ។"
            : "ម្ចាស់បានបិទការផ្សព្វផ្សាយជាបណ្តោះអាសន្ន។ Please check back later.";
    return {
        loading: isEn ? "Loading invitation…" : isKh ? "កំពុងផ្ទុកសន្លឹកការ..." : "កំពុងផ្ទុកសន្លឹកការ... / Loading invitation…",
        title,
        message,
        unavailable: title,
        unavailableDetail: message,
        stateType: "UNPUBLISHED",
    };
}

function readStoredAccessToken(slug) {
    if (!slug) return "";
    try {
        return sessionStorage.getItem(`koupreng_invitation_access_${slug}`) || "";
    } catch {
        return "";
    }
}

export default function PublicInvitationPage() {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const currentUserId = user?.id || user?.userId || "";
    const inviteToken = resolveInviteToken(searchParams);
    const queryAccessToken = searchParams.get("accessToken") || "";
    const queryLang = searchParams.get("lang") || "";
    const accessStorageKey = slug ? `koupreng_invitation_access_${slug}` : "";

    const [invitation, setInvitation] = useState(null);
    const [media, setMedia] = useState(null);
    const [remoteLoading, setRemoteLoading] = useState(true);
    const [remoteError, setRemoteError] = useState("");
    const [errorType, setErrorType] = useState(null);
    const [userOwnsInvitation, setUserOwnsInvitation] = useState(false);
    const [protectedMode, setProtectedMode] = useState(false);
    const [verifyingAccess, setVerifyingAccess] = useState(false);
    const [accessAttempt, setAccessAttempt] = useState(0);
    // Access grants are namespaced by slug so a token minted for one invitation
    // can never be presented to another slug during a route switch.
    const [accessGrant, setAccessGrant] = useState(() => ({
        slug: slug || "",
        token: readStoredAccessToken(slug),
    }));
    // The identity that produced the currently painted payload. Anything the
    // guest sees must match the live slug/token identity, never a prior one.
    const [loadedIdentity, setLoadedIdentity] = useState("");

    const queryLangRef = useRef(queryLang);
    const requestGeneration = useRef(0);
    const invitationShellRef = useRef(null);
    const restoreFocusRef = useRef(false);

    useEffect(() => {
        queryLangRef.current = queryLang;
    }, [queryLang]);

    const verifiedAccessToken = accessGrant.slug === slug ? accessGrant.token : "";
    const effectiveAccessToken = queryAccessToken || verifiedAccessToken;
    // Server-owned identity. Only a slug/invite-token/access-token change may
    // trigger a re-fetch; a locale change is a pure view transform.
    const requestIdentity = `${slug || ""}\u0000${inviteToken || ""}\u0000${effectiveAccessToken || ""}`;

    // Owner chrome is granted only by the authenticated account's own server
    // list. A navigation hint, a slug/id heuristic or an ownerless local draft
    // is never authority.
    useEffect(() => {
        if (!isAuthenticated || !slug) {
            setUserOwnsInvitation(false);
            return undefined;
        }
        let active = true;
        setUserOwnsInvitation(false);
        invitationService.listMine()
            .then((items) => {
                if (!active) return;
                const list = Array.isArray(items) ? items : items?.data || [];
                const target = String(slug || "").toLowerCase();
                const owns = list.some((item) => {
                    const itemSlug = String(item?.slug || "").toLowerCase();
                    const itemId = String(item?.id || item?.invitationId || "");
                    const itemBackendId = String(item?.backendInvitationId || "");
                    return itemSlug === target || itemId === target || itemBackendId === target;
                });
                setUserOwnsInvitation(owns);
            })
            .catch(() => {
                if (active) setUserOwnsInvitation(false);
            });
        return () => {
            active = false;
        };
    }, [isAuthenticated, slug, currentUserId]);

    useEffect(() => {
        // Reload the grant that belongs to the active slug only; a prior slug's
        // grant must never survive the switch.
        setAccessGrant({ slug: slug || "", token: readStoredAccessToken(slug) });
        setProtectedMode(false);
    }, [slug]);

    const loadCinematicVideo = useCallback(signal => mediaService.publicCinematicContent(slug, invitation?.cinematicOpening?.videoMediaId,
        { accessToken: effectiveAccessToken || null, inviteToken: inviteToken || null }, signal), [slug, invitation?.cinematicOpening?.videoMediaId, effectiveAccessToken, inviteToken]);

    useEffect(() => {
        if (!slug) {
            requestGeneration.current += 1;
            setInvitation(null);
            setMedia(null);
            setErrorType("NOT_FOUND");
            setRemoteError(publicStateCopy(queryLangRef.current || useLanguageStore.getState().lang, "NOT_FOUND").message);
            setRemoteLoading(false);
            setLoadedIdentity(requestIdentity);
            return undefined;
        }

        const generation = requestGeneration.current + 1;
        requestGeneration.current = generation;
        const isCurrent = () => generation === requestGeneration.current;

        // Clear the prior identity before any request starts so a slow response
        // can never repaint the previous guest/owner payload.
        setRemoteLoading(true);
        setRemoteError("");
        setErrorType(null);
        setProtectedMode(false);
        setInvitation(null);
        setMedia(null);

        const publicParams = {
            accessToken: effectiveAccessToken,
            token: inviteToken,
        };

        Promise.all([
            invitationService.publicBySlug(slug, publicParams),
            mediaService.publicBySlug(slug, publicParams).catch(() => null),
            // Also load dynamic catalog so admin-created templates can be resolved
            templateCatalogService.list().then((items) => {
                if (items?.length) registerDynamicTemplates(items);
            }).catch(() => {}),
        ])
            .then(([invitationData, mediaData]) => {
                if (!isCurrent()) return;
                setInvitation(invitationData || null);
                setMedia(mediaData || null);
                setRemoteError("");
                setErrorType(null);
                setProtectedMode(false);
                setLoadedIdentity(requestIdentity);
            })
            .catch((err) => {
                if (!isCurrent()) return;
                const protectedError = err?.status === 403;
                const storedToken = accessStorageKey ? readStoredAccessToken(slug) : "";
                if (protectedError && storedToken) {
                    try {
                        sessionStorage.removeItem(accessStorageKey);
                    } catch {
                        // Storage may be disabled; authority still derives from the server.
                    }
                    setAccessGrant({ slug: slug || "", token: "" });
                }
                const is404 = err?.status === 404 || String(err?.message || "").toLowerCase().includes("not found");
                const detectedType = is404 ? "NOT_FOUND" : "UNPUBLISHED";
                const fallbackLang = String(queryLangRef.current || useLanguageStore.getState().lang || "km").toUpperCase();
                setErrorType(detectedType);
                setProtectedMode(protectedError);
                setRemoteError(protectedError
                    ? formatPublicAccessError(err, fallbackLang === "EN")
                    : (err?.message || publicStateCopy(fallbackLang, detectedType).message));
                setLoadedIdentity(requestIdentity);
            })
            .finally(() => {
                if (isCurrent()) setRemoteLoading(false);
            });

        return () => {
            requestGeneration.current += 1;
        };
    }, [requestIdentity, slug, accessStorageKey, inviteToken, effectiveAccessToken]);

    // Move focus into the unlocked invitation once it has actually painted.
    useEffect(() => {
        if (!restoreFocusRef.current || remoteLoading || !invitation) return undefined;
        restoreFocusRef.current = false;
        const target = invitationShellRef.current;
        if (!target) return undefined;
        const schedule = typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
            ? window.requestAnimationFrame
            : (callback) => window.setTimeout(callback, 0);
        const cancel = typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function"
            ? window.cancelAnimationFrame
            : window.clearTimeout;
        const frame = schedule(() => {
            if (document.activeElement === document.body || document.activeElement == null) {
                target.focus();
            }
        });
        return () => cancel(frame);
    }, [invitation, remoteLoading]);

    const rawDraft = useMemo(
        () => (invitation ? publicInvitationToDraft(invitation, media) : null),
        [invitation, media]
    );
    // Locale is a view-only projection over the already fetched payload. It must
    // never clear the payload or flip the remote loading state.
    const displayLocale = useMemo(
        () => (rawDraft ? guestLocale(rawDraft, queryLang) : "km"),
        [rawDraft, queryLang]
    );
    const publicDraft = useMemo(() => {
        if (!rawDraft) return null;
        return rawDraft.localizedContentV1 ? projectLocale(rawDraft, displayLocale) : rawDraft;
    }, [rawDraft, displayLocale]);
    const mergedPublicGarden = useMemo(
        () => (publicDraft ? draftToTemplate(publicDraft, publicDraft.gallery) : null),
        [publicDraft]
    );

    const isOwner = Boolean(isAuthenticated && userOwnsInvitation);

    if (remoteLoading || loadedIdentity !== requestIdentity) {
        const effectiveLang = invitation?.languageMode || queryLang || useLanguageStore.getState().lang;
        return <PageSkeleton layout="public" label={publicStateCopy(effectiveLang).loading} />;
    }

    const verifyAccess = async (password) => {
        setVerifyingAccess(true);
        setRemoteError("");
        try {
            const response = await invitationService.verifyPublicAccess(slug, {
                password,
                inviteToken,
                accessToken: effectiveAccessToken,
            });
            if (response?.accessToken) {
                try {
                    sessionStorage.setItem(accessStorageKey, response.accessToken);
                } catch {
                    // Storage may be disabled; the in-memory grant still authorizes this view.
                }
                setAccessGrant({ slug: slug || "", token: response.accessToken });
            }
            setProtectedMode(false);
            restoreFocusRef.current = true;
        } catch (err) {
            const fallbackLang = String(invitation?.languageMode || queryLang || useLanguageStore.getState().lang || "km").toUpperCase();
            setRemoteError(formatPublicAccessError(err, fallbackLang === "EN"));
            // A rejected attempt must clear the field and never echo the secret.
            setAccessAttempt((value) => value + 1);
        } finally {
            setVerifyingAccess(false);
        }
    };

    if (invitation) {
        const isInvPublished = invitation.status ? invitation.status === "PUBLISHED" : invitation.published !== false;
        if (!isInvPublished) {
            return (
                <PublicUnavailableView
                    stateType="UNPUBLISHED"
                    languageMode={invitation?.languageMode}
                    isOwner={isOwner}
                />
            );
        }
        if (!publicDraft || !mergedPublicGarden) return <TemplateUnavailable />;
        const showRsvp = publicDraft.enabledSections?.rsvp !== false;

        const royalGarden = [mergedPublicGarden.tpl?.code, mergedPublicGarden.tpl?.slug, mergedPublicGarden.tpl?.templateCode].includes('royal-garden-cinematic');
        const ownLocaleControl = royalGarden || [mergedPublicGarden.tpl?.code, mergedPublicGarden.tpl?.slug, mergedPublicGarden.tpl?.templateCode].includes('khmer-floral-gold');
        return (
            <div
                ref={invitationShellRef}
                tabIndex={-1}
                lang={displayLocale}
                className={royalGarden ? 'public-royal-garden' : undefined}
                style={{ outline: "none" }}
            >
            {!ownLocaleControl && rawDraft.localizedContentV1 && localeContent(rawDraft).enabledLocales.includes('en') && <nav className="public-locale-switch" aria-label="Invitation language">{[['km', '\u1781\u17d2\u1798\u17c2\u179a'], ['en', 'English']].map(([locale, label]) => <button key={locale} type="button" lang={locale} aria-pressed={displayLocale === locale} onClick={() => { const params = new URLSearchParams(searchParams); params.set('lang', locale); setSearchParams(params, { replace: true, preventScrollReset: true }); }}>{label}</button>)}</nav>}
            {!ownLocaleControl && searchParams.get('lang') === 'en' && displayLocale !== 'en' && <p role="status" lang="en">English is not published for this invitation. Showing Khmer.</p>}
            <TemplateExperience
                cinematicOpening={invitation?.cinematicOpening}
                cinematicLanguage={publicDraft.languageMode}
                cinematicKey={slug}
                loadCinematicVideo={loadCinematicVideo}
                tpl={mergedPublicGarden.tpl}
                variant={mergedPublicGarden.variant}
                showActions={false}
                showBreadcrumb={false}
                showStickyCta={true}
            >
                {showRsvp && (
                    <PublicRsvpForm
                        slug={slug}
                        inviteToken={inviteToken}
                        accessToken={effectiveAccessToken}
                        languageMode={publicDraft.languageMode}
                    />
                )}
            </TemplateExperience>
            <PublicTicketAccess compact={ownLocaleControl} displayContent={publicDraft} languageMode={publicDraft.languageMode} slug={slug} token={inviteToken} accessToken={effectiveAccessToken} />
            </div>
        );
    }

    if (protectedMode) {
        return (
            <ProtectedInvitationGate
                error={remoteError}
                loading={verifyingAccess}
                attempt={accessAttempt}
                onSubmit={verifyAccess}
                languageMode={invitation?.languageMode || queryLang || useLanguageStore.getState().lang || "km"}
            />
        );
    }

    const effectiveStateType = userOwnsInvitation ? "UNPUBLISHED" : (errorType || "NOT_FOUND");
    return (
        <PublicUnavailableView
            stateType={effectiveStateType}
            languageMode={invitation?.languageMode || queryLang}
            isOwner={isOwner}
        />
    );
}

function formatPublicAccessError(err, isEn) {
    const raw = String(err?.message || "");
    const lower = raw.toLowerCase();
    if (err?.status === 429 || lower.includes("too many") || lower.includes("rate limit")) {
        return isEn
            ? "Too many attempts. Please wait a minute and try again."
            : "ព្យាយាមបញ្ចូលពាក្យសម្ងាត់ច្រើនដងពេក។ សូមរង់ចាំមួយភ្លែត រួចសាកល្បងម្តងទៀត។";
    }
    if (lower.includes("password required")) {
        return isEn
            ? "Please enter the invitation password."
            : "សូមបញ្ចូលពាក្យសម្ងាត់ដើម្បីបើកសន្លឹកការ។";
    }
    if (lower.includes("invalid invitation password") || lower.includes("incorrect password") || err?.status === 403) {
        return isEn
            ? "Incorrect password. Please try again or use your personal guest link."
            : "ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។ សូមពិនិត្យម្តងទៀត ឬប្រើតំណភ្ជាប់ផ្ទាល់ខ្លួនរបស់ភ្ញៀវ។";
    }
    return raw || (isEn ? "This invitation requires a password." : "សន្លឹកការនេះត្រូវការពាក្យសម្ងាត់។");
}

function ProtectedInvitationGate({ error, loading, attempt = 0, onSubmit, languageMode = "km" }) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const passwordRef = useRef(null);
    const isEn = String(languageMode).toUpperCase() === "EN";

    // The gate is the only thing a protected guest can act on: focus the field.
    useEffect(() => {
        passwordRef.current?.focus?.();
    }, []);

    // A rejected attempt clears the secret (it is never echoed) and returns
    // focus to the field for a clean retry.
    useEffect(() => {
        if (!attempt) return;
        setPassword("");
        passwordRef.current?.focus?.();
    }, [attempt, error]);

    return (
        <main className="public-state protected-gate">
            <form
                className="protected-gate-card"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (loading) return;
                    onSubmit(password);
                }}
            >
                <div className="protected-gate-card-badge" aria-hidden="true">
                    <Lock size={24} />
                </div>
                <p className="pub-kicker">{isEn ? "Private Invitation" : "សន្លឹកការឯកជន"}</p>
                <h1>{isEn ? "Enter Password" : "បញ្ចូលពាក្យសម្ងាត់"}</h1>
                <p>{isEn ? "Please enter the password or use your secure guest link to view the invitation." : "សូមប្រើពាក្យសម្ងាត់ ឬតំណភ្ជាប់ភ្ញៀវដែលមានសុវត្ថិភាពដើម្បីបើកសន្លឹកការ។"}</p>
                <label className="protected-gate-field">
                    <span>{isEn ? "Password" : "ពាក្យសម្ងាត់"}</span>
                    <div className="protected-gate-input-wrap">
                        <input
                            ref={passwordRef}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? "protected-gate-error" : undefined}
                            placeholder={isEn ? "Enter access password" : "វាយបញ្ចូលពាក្យសម្ងាត់"}
                            disabled={loading}
                            required
                        />
                        <button
                            type="button"
                            className="protected-gate-toggle"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? (isEn ? "Hide password" : "លាក់ពាក្យសម្ងាត់") : (isEn ? "Show password" : "បង្ហាញពាក្យសម្ងាត់")}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                    </div>
                </label>
                {error && <div id="protected-gate-error" className="inv-error" role="alert">{error}</div>}
                <button className="inv-primary-btn" type="submit" disabled={loading} aria-busy={loading}>
                    {loading ? (isEn ? "Checking..." : "កំពុងពិនិត្យ...") : (isEn ? "Unlock Invitation" : "បើកសន្លឹកការ")}
                </button>
            </form>
        </main>
    );
}

function PublicUnavailableView({
    stateType = "UNPUBLISHED",
    title,
    message,
    languageMode = "",
    isOwner = false,
}) {
    const isEn = String(languageMode).toUpperCase() === "EN";
    const copy = publicStateCopy(languageMode, stateType);
    const finalTitle = title || copy.title;
    const finalMessage = message || copy.message;
    const isNotFound = stateType === "NOT_FOUND";

    return (
        <main
            style={{
                minHeight: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "var(--ui-theme-canvas, #f7f5f0)",
                fontFamily: "var(--ui-font, 'DM Sans', 'Kantumruy Pro', system-ui, sans-serif)",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "460px",
                    background: "var(--ui-theme-surface, #fffefb)",
                    border: "1px solid var(--ui-theme-border, rgba(185, 139, 66, 0.25))",
                    borderRadius: "24px",
                    padding: "44px 32px 36px",
                    textAlign: "center",
                    boxShadow: "var(--ui-theme-shadow-elevated, 0 20px 48px -10px rgba(28, 40, 34, 0.14))",
                }}
            >
                <div
                    style={{
                        width: "68px",
                        height: "68px",
                        margin: "0 auto 20px",
                        borderRadius: "22px",
                        background: "var(--ui-theme-gold-soft, rgba(185, 139, 66, 0.14))",
                        border: "1px solid var(--ui-theme-border, rgba(185, 139, 66, 0.3))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ui-theme-gold, #8c6628)",
                        fontSize: "2rem",
                    }}
                >
                    {isNotFound ? <IoSearchOutline /> : <IoLockClosedOutline />}
                </div>

                <div
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--ui-theme-gold, #8c6628)",
                        marginBottom: "12px",
                    }}
                >
                    {isEn ? "Digital Wedding Hub" : "គូព្រេង • សំបុត្រអញ្ជើញឌីជីថល"}
                </div>

                <h1
                    style={{
                        fontSize: "1.375rem",
                        fontWeight: 800,
                        color: "var(--ui-theme-ink, #1e2824)",
                        margin: "0 0 12px",
                        lineHeight: 1.5,
                    }}
                >
                    {finalTitle}
                </h1>

                <p
                    style={{
                        fontSize: "0.9375rem",
                        color: "var(--ui-theme-muted, #525f58)",
                        lineHeight: 1.7,
                        margin: isOwner ? "0 0 28px" : "0",
                    }}
                >
                    {finalMessage}
                </p>

                {isOwner && (
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <Link
                            to="/dashboard"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "11px 24px",
                                minHeight: "44px",
                                borderRadius: "14px",
                                background: "var(--ui-theme-action, #1c3a32)",
                                color: "var(--ui-theme-on-action, #ffffff)",
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                textDecoration: "none",
                                transition: "transform 0.15s ease",
                            }}
                        >
                            <IoHomeOutline style={{ fontSize: "1.1rem" }} />
                            <span>{isEn ? "Go to Dashboard" : "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង"}</span>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
