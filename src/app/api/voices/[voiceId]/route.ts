import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database";
import { getSignedAudioUrl } from "@/lib/r2";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ voiceId: string }>},
) {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { voiceId } = await params;

    const voice = await prisma.voice.findUnique({
        where: { id: voiceId },
        select: {
            variant: true,
            orgId: true,
            r2ObjectKey: true,
        },
    });

    if (!voice) {
        return new Response("Not found", { status: 404 });
    }

    if (voice.variant === "CUSTOM" && voice.orgId !== orgId) {
        return new Response("Not found", { status: 404 });
    }

    if (!voice.r2ObjectKey) {
        return new Response("Voice audio is not available yet", { status: 409 });
    }

    let signedUrl: string;
    try {
        signedUrl = await getSignedAudioUrl(voice.r2ObjectKey);
    } catch {
        return new Response("Failed to generate audio URL", { status: 502 });
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    let audioResponse: Response;
    try {
        audioResponse = await fetch(signedUrl, { signal: abortController.signal });
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
            return new Response("Audio fetch timeout", { status: 504 });
        }
        return new Response("Failed to fetch voice audio", { status: 502 });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!audioResponse.ok) {
        return new Response("Failed to fetch voice audio", { status: 502 });
    }

    const contentType = audioResponse.headers.get("content-type") || "audio/wav";

    return new Response(audioResponse.body, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control":
                voice.variant === "SYSTEM"
                    ? "public, max-age=86400"
                    : "private, max-age=3600"
        }
    })
};