"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioPlayback(src: string | File | null) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current = null;
            }
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            setIsPlaying(false);
            setIsLoading(false);
        };
    }, [src]);

    const togglePlay = useCallback(() => {
        if (!src) return;

        if (!audioRef.current) {
            let url: string;
            if (src instanceof File) {
                url = URL.createObjectURL(src);
                objectUrlRef.current = url;
            } else {
                url = src;
            }
            audioRef.current = new Audio(url);
            audioRef.current.addEventListener("ended", () => setIsPlaying(false));
            audioRef.current.addEventListener(
                "canplaythrough",
                () => setIsLoading(false),
                { once: true },
            );
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsLoading(true);
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                })
                .catch(() => {
                    setIsLoading(false);
                });
        }
    }, [src, isPlaying]);

    return { isPlaying, isLoading, togglePlay }
};
