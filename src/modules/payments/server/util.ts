import "server-only";

export async function getPesapalToken(): Promise<string> {
  const response = await fetch(
    `${process.env.PESAPAL_API_URL}/Auth/RequestToken`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get PESAPAL token");
  }

  const data = await response.json();
  console.log("Token errro: >>>>", data);
  console.log(
    "Token keys errro: >>>>",
    data,
    process.env.PESAPAL_CONSUMER_KEY,
    process.env.PESAPAL_CONSUMER_SECRET
  );
  return data.token;
}
