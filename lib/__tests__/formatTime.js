import formatTime from "../formatTime";

test("formatTime() ", () => {
  expect(formatTime(60000)).toBe('16:40:00');
});
