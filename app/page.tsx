import { Account, Activity } from "@/interfaces/global";

import "./globals.css";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import moment from "moment";

interface UserActivities {
  account: Account;
  activities: Activity[];
}

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

  function groupByWeek(items: Activity[]) {
    const grouped: { [key: string]: Activity[] } = {};

    items.forEach((item) => {
      const key = `${moment(item.occurred_at).week()}-${moment(
        item.occurred_at
      ).year()}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(item);
    });

    return grouped;
  }

  function groupWeeksActivitiesByUser(weeks: { [key: string]: Activity[] }) {
    const weeksActivitiesByUser: {
      [key: string]: {
        [key: string]: UserActivities;
      };
    } = {};

    Object.keys(weeks).forEach((week: string) => {
      const weekActivitiesByUser = weeks[week].reduce(
        (
          acc: {
            [key: string]: UserActivities;
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

      weeksActivitiesByUser[week] = weekActivitiesByUser;
    });

    return weeksActivitiesByUser;
  }

  const weeks = groupByWeek(data);
  const weeksActivitiesByUser = groupWeeksActivitiesByUser(weeks);

  const weeklyRanking = Object.keys(weeksActivitiesByUser).reduce(
    (
      weeksAcc: {
        [key: string]: UserActivities[];
      },
      key
    ) => {
      const week = weeksActivitiesByUser[key];
      const users = Object.keys(week).reduce(
        (acc: UserActivities[], userId: string) => {
          acc.push(week[userId]);

          return acc;
        },
        []
      );

      const orderedUsersByActivitiesNumber = users.sort((a, b) => {
        if (a.activities.length > b.activities.length) {
          return -1;
        }
        if (a.activities.length < b.activities.length) {
          return 1;
        }
        return 0;
      });

      weeksAcc[key] = orderedUsersByActivitiesNumber;

      return weeksAcc;
    },
    {}
  );

  function getOverallUsersPoints(rankingByWeek: typeof weeklyRanking) {
    const points: {
      [key: string]: {
        account: Account;
        points: number;
      };
    } = {};

    Object.values(rankingByWeek).forEach((week) => {
      week.forEach((userActivities, index) => {
        // // only the first 3 makes points
        const potuation = 3 - index >= 0 ? 3 - index : 0;

        if (points[userActivities.account.id]) {
          points[userActivities.account.id] = {
            ...points[userActivities.account.id],
            points: points[userActivities.account.id].points + potuation,
          };
        } else {
          points[userActivities.account.id] = {
            account: userActivities.account,
            points: potuation,
          };
        }
      });
    });

    return points;
  }

  const overallUsersPoints = getOverallUsersPoints(weeklyRanking);
  const usersRankedByPoints = Object.values(overallUsersPoints).sort((a, b) => {
    if (a.points > b.points) {
      return -1;
    }
    if (a.points < b.points) {
      return 1;
    }
    return 0;
  });

  return (
    <main className="p-10">
      <h2 className="text-2xl font-bold text-center">Ranking Geral</h2>
      <div className="flex flex-col gap-2 max-w-sm mx-auto mt-5">
        {usersRankedByPoints.map((user, index) => {
          const isWinner = index === 0;

          return (
            <div key={user.account.id} className="flex items-center gap-2">
              <p
                className={twMerge([
                  "font-bold",
                  isWinner ? "text-xl" : "text-base",
                ])}
              >
                {index + 1} -{" "}
              </p>
              <div key={user.account.id} className="flex gap-2 items-center">
                <Image
                  className={twMerge([
                    "object-cover rounded-full bg-black",
                    isWinner ? "w-[80px] h-[80px]" : "w-[60px] h-[60px]",
                  ])}
                  src={
                    user.account.profile_picture_url ??
                    "https://t4.ftcdn.net/jpg/04/70/29/97/360_F_470299797_UD0eoVMMSUbHCcNJCdv2t8B2g1GVqYgs.jpg"
                  }
                  alt="Profile picture"
                  width={isWinner ? 80 : 60}
                  height={isWinner ? 80 : 60}
                />
                <div>
                  <p className="font-bold text-xl">{user.account.full_name}</p>
                  <p className="font-bold">{user.points} Pontos</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <h2 className="text-2xl font-bold mt-5">Ranking Semanal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 mt-5">
        {Object.keys(weeksActivitiesByUser)
          .reverse()
          .map((weekKey, index) => {
            return (
              <div key={weekKey} className="flex flex-col gap-2">
                <h1 className="text-purple-500 font-bold text-xl">
                  Semana {index + 1} - {weeks[weekKey].length} atividade
                  {weeks[weekKey].length > 1 ? "s" : ""}
                </h1>

                <div className="flex flex-col gap-4">
                  {weeklyRanking[weekKey].map((user, index) => {
                    const isWinner = index === 0;
                    return (
                      <div
                        key={user.account.id}
                        className="flex items-center gap-2"
                      >
                        <p
                          className={twMerge([
                            "font-bold",
                            isWinner ? "text-xl" : "text-base",
                          ])}
                        >
                          {index + 1} -{" "}
                        </p>
                        <div
                          key={user.account.id}
                          className="flex gap-2 items-center"
                        >
                          <Image
                            className={twMerge([
                              "object-cover rounded-full bg-black",
                              isWinner
                                ? "w-[80px] h-[80px]"
                                : "w-[60px] h-[60px]",
                            ])}
                            src={
                              user.account.profile_picture_url ??
                              "https://t4.ftcdn.net/jpg/04/70/29/97/360_F_470299797_UD0eoVMMSUbHCcNJCdv2t8B2g1GVqYgs.jpg"
                            }
                            alt="Profile picture"
                            width={isWinner ? 80 : 60}
                            height={isWinner ? 80 : 60}
                          />
                          <div>
                            <p className="font-bold text-xl">
                              {user.account.full_name}
                            </p>
                            <p className="font-bold">
                              {user.activities.length} atividade
                              {user.activities.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* <div className="flex flex-col gap-5 mt-4">
                    {orderedUsersByActivitiesNumber.map(
                      ({ account, activities }) => {
                        return (
                          <div key={account.id} className="">
                            <h3 className=" font-bold">
                              {account.full_name} - {activities.length} ponto
                              {activities.length > 1 ? "s" : ""}
                            </h3>
                            <ol className="flex flex-col gap-2 mt-2 list-decimal">
                              {activities.reverse().map((activity) => (
                                <li className="flex-1" key={activity.id}>
                                  {activity.title}
                                </li>
                              ))}
                            </ol>
                          </div>
                        );
                      }
                    )}
                  </div> */}
              </div>
            );
          })}
      </div>
    </main>
  );
}
