export default async function handler(req, res) {
  const { path, ...query } = req.query;

  if (!path) {
    return res.status(400).json({
      error: "Missing football-data path",
    });
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }

  const queryString = params.toString();

  const url =
    `https://api.football-data.org/v4/${path}` +
    (queryString ? `?${queryString}` : "");

  try {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to contact football-data.org",
    });
  }
}