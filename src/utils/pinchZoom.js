

// eslint-disable-next-line import/no-anonymous-default-export
export default function (element) {
  let elementScale = 1;
  let start = {};

  const distance = (event) => {
    return Math.hypot(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY);
  }

  element.addEventListener('touchstart', (event) => {
    console.log('touchstart', event);
    if (event.touches.length === 2) {
      event.preventDefault();

      start.x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
      start.y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
      start.distance = distance(event);
    }
  })

  element.addEventListener('touchmove', (event) => {
    console.log('touchmove', event);
    if (event.touches.length === 2) {
      event.preventDefault();
      let scale;

      if (event.scale) {
        scale = event.scale;
      } else {
        const deltaDistance = distance(event);
        scale = deltaDistance / start.distance;
      }

      elementScale = Math.min(Math.max(1, scale), 4);

      // Calculate how much the fingers have moved on the X and Y axis
      const deltaX = (((event.touches[0].pageX + event.touches[1].pageX) / 2) - start.x) * 2; // x2 for accelarated movement
      const deltaY = (((event.touches[0].pageY + event.touches[1].pageY) / 2) - start.y) * 2; // x2 for accelarated movement

      // Transform the image to make it grow and move with fingers
      const transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${elementScale})`;
      element.style.transform = transform;
      element.style.WebkitTransform = transform;
      element.style.zIndex = "9999";
    }
  })



}