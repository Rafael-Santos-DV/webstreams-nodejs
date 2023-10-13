const API_URL = "http://localhost:3000";

async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal,
  });

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON());

  return reader;
}

function appendToHTML(element) {
  return new WritableStream({
    write({ title, description, url_anime }) {
      console.log(element);
      element.innerHTML += `
        <article>
            <h2>${title}</h2>
            <p>${description}</p>
            <a href=${url_anime}>Link</a>
        </article>
        `;
    },
    abort(reason) {
      console.log("reason: ", reason);
    },
  });
}

function parseNDJSON() {
  let ndjsonBuffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      ndjsonBuffer += chunk;

      const items = ndjsonBuffer.split("\n");

      items
        .slice(0, -1)
        .forEach((item) => controller.enqueue(JSON.parse(item)));

      ndjsonBuffer = items[items.length - 1];
    },
    flush(controller) {
      if (!ndjsonBuffer) return;

      controller.enqueue(JSON.parse(ndjsonBuffer));
    },
  });
}

const [start, stop, cards] = ["start", "stop", "cards"].map((item) =>
  document.getElementById(item)
);

let abortController = new AbortController();

start.addEventListener("click", async () => {
  console.log("start");
  const readable = await consumeAPI(abortController.signal);
  readable.pipeTo(appendToHTML(cards));
});

stop.addEventListener("click", () => {
  abortController.abort();
  console.log("stop");
  abortController = new AbortController();
});
