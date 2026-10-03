import React, { useRef, useEffect } from "react";
import { useWindowDimensions, View, StyleSheet, Platform } from "react-native";

interface BackgroundVideoProps {
  source: string;
  children: React.ReactNode;
  overlayColor?: string;
  overlayOpacity?: number;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  source,
  children,
  overlayColor = "#000",
  overlayOpacity = 0.35,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { width } = useWindowDimensions();
  const prefersReducedMotion =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
      : false;

  useEffect(() => {
    if (Platform.OS === "web" && videoRef.current && !prefersReducedMotion) {
      videoRef.current.play().catch((error) => {
        console.warn("Background video playback failed:", error);
      });
    }
  }, [prefersReducedMotion]);

  const videoHeight = 340;

  return (
    <View
      style={[styles.container, { width, height: videoHeight }]}
      accessibilityLabel="Background decoration"
    >
      {!prefersReducedMotion && Platform.OS === "web" ? (
        <video
          ref={videoRef}
          src={source}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          autoPlay
          loop
          muted
          playsInline
          onError={(error) => console.warn("Video error:", error)}
          aria-label="Decorative background video"
        />
      ) : (
        <View
          style={[
            styles.video,
            { width, height: videoHeight, backgroundColor: overlayColor },
          ]}
        />
      )}
      <View
        style={[
          styles.overlay,
          { width, height: videoHeight, backgroundColor: overlayColor, opacity: overlayOpacity },
        ]}
        pointerEvents="none"
      />
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  content: {
    position: "relative",
    zIndex: 10,
    flex: 1,
  },
});

