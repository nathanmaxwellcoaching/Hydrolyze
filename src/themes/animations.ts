import anime from 'animejs';

/**
 * Defines the spring physics for animations to create a natural, bouncy effect.
 * - damping: Controls how quickly the spring settles. Higher values are less bouncy.
 * - stiffness: The spring stiffness. Higher values make the spring stronger and faster.
 * - mass: The mass of the object being animated.
 */
export const spring = {
  damping: 15,
  stiffness: 120,
  mass: 1,
};

/**
 * A standard animation preset for elements fading in and moving up smoothly.
 * It combines opacity, blur, and translation with spring physics for a polished effect.
 * 
 * @param targets The anime.js targets to animate.
 * @param delay An optional delay or stagger value.
 */
export const fadeInWithBlur = (targets: anime.AnimeParams['targets'], delay: anime.AnimeParams['delay'] = 0) => {
  return anime({
    targets,
    opacity: [0, 1],
    filter: ['blur(8px)', 'blur(0px)'],
    translateY: [15, 0],
    scale: [0.98, 1],
    delay,
    easing: 'spring(1, 100, 15, 0)', // Using the string shorthand for spring
    duration: 800, // Duration is still useful for spring timing
  });
};
