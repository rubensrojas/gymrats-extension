import { Account, Activity } from "@/interfaces/global";

import "./globals.css";

async function getData() {
  const challengId = process.env.CHALLENGE_ID;
  const token = process.env.TOKEN ?? "";

  const headers = new Headers();
  headers.append("Authorization", token);

  const res = await fetch(
    `https://www.gymrats.app/api/challenges/${challengId}/workouts`,
    {
      method: "GET",
      headers,
      cache: "no-cache",
    }
  );
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  const data: {
    data: Activity[];
  } = await res.json();

  return data.data;
}

export default async function Home() {
  const data = await getData();

  const usersActivity = data.reduce(
    (
      acc: {
        [key: string]: {
          account: Account;
          activities: Activity[];
        };
      },
      item: Activity
    ) => {
      const userId = item.account.id.toString();
      if (acc[userId]) {
        acc[userId] = {
          ...acc[userId],
          activities: [...acc[userId].activities, item],
        };
      } else {
        acc[userId] = {
          account: item.account,
          activities: [item],
        };
      }

      return acc;
    },
    {}
  );

  return (
    <main className="p-10">
      <div className="flex gap-4 justify-between">
        {Object.keys(usersActivity).map((key) => {
          const { account, activities } = usersActivity[key];

          return (
            <div key={key} className="flex flex-col gap-1">
              <h1 className="text-purple-500 font-bold">{account.full_name}</h1>
              <p className="font-bold">
                {activities.length} atividade{activities.length > 1 ? "s" : ""}
              </p>
              <ul className="flex flex-col gap-2 mt-2">
                {activities.map((activity) => (
                  <li className="flex-1" key={activity.id}>
                    {activity.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}
