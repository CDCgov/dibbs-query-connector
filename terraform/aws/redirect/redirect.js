function handler(event) {
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: {
      location: { value: "${target_url}" + event.request.uri },
    },
  };
}
