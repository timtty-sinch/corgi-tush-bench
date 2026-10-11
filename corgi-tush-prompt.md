Create a realistic, interactive 3D model of a Pembroke Welsh Corgi seen from behind, as a single self-contained HTML file.

1. One HTML file, everything inline. No build step. Must work opened from disk in Chrome.
2. Three.js and its official add-ons may be loaded from cdnjs.cloudflare.com or cdn.jsdelivr.net. Pin an exact version. No other external resources: no images, textures, models, fonts. All geometry, fur and materials procedural.
3. Anatomy. Model the rear half of an adult corgi from mid-back to paws: the round, heart-shaped "loaf" rump with its fluffy white "pants," short stubby hind legs with visible hocks and paws, and a docked tail stub or none. Proportions must match a real corgi: low to the ground, long back, wide fluffy rear. The rest of the body may fade out or be cropped, but must not end in a visible hard cut.
4. Every visible angle must be convincing. The user will orbit around the dog, so the back, sides and underside all need a believable shape. No side may look like a blob or a mirrored copy of the back.
5. Wiggle (the main event). The rump must wiggle the way a happy corgi's does, with real variation, not one canned loop:
   * Idle: a gentle breathing sway with occasional small weight shifts between hind legs.
   * Click/tap the dog to trigger a wiggle. Each click picks from at least four distinct wiggles, e.g. a quick happy side-to-side, a slow exaggerated loaf sway, a full-body "zoomies prep" shimmy, and a little hop-and-settle. No two consecutive clicks should feel identical: vary speed, amplitude, rhythm and which body parts lead.
   * Rapid repeated clicks build excitement: wiggles get bigger and faster, then calm back down over a few seconds.
   * Fur must lag and jiggle with secondary motion (the pants and rump fluff follow the body with damped spring physics). Legs stay planted on the ground unless a wiggle deliberately lifts a paw.
6. Coat. Pick a realistic Pembroke color at load (red-and-white, sable, tricolor, or black-headed tricolor), randomized each time the page opens, with the correct white markings on the pants and legs and natural color blending at the borders.
7. Fur that looks like real fur: visible fluff density, soft silhouette edges (shell/fin fur or similar), longer, fluffier fur on the pants, shorter fur on the legs, no plastic or solid-surface look. Soft, warm lighting with soft shadows on a simple ground plane.
8. Interaction: drag to orbit around the dog. No zoom.
9. Embeddable component. It will be shown inside a 400 x 400 pixel container on another page. No controls, sliders, text or title. Just the canvas filling its container, with the best defaults built in. The dog must be fully in frame and centered, including during the biggest wiggles. Resize with the container.
10. Smooth 60 fps, no console errors.
11. Complete and working. No placeholders or TODOs.

Work only on this one HTML file. Do not read, search or modify anything else in the project. You have 2 hours, up to 3 if quality requires it. You may open the file with Playwright at 400 x 400, take screenshots from the back, sides and below, record a few frames mid-wiggle, check the console, and iterate until every angle and every wiggle looks as good as you can make it. Deliver the final HTML file.
