useEffect(() => {
  const getRequestWithNativeFetch = async (url) => {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error: Status ${response.status}`);
    }

    return console.log(response.json());
  };
});
