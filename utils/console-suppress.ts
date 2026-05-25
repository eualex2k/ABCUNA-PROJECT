// Silence console.log/info in production build
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.info = () => {};
}
