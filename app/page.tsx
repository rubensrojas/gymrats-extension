import { Account, Activity } from "@/interfaces/global";

import "./globals.css";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import moment from "moment";
import Error from "./error";

interface UserActivities {
  account: Account;
  activities: Activity[];
}

interface RankedUser {
  account: Account;
  points: number;
  consectutiveDays: number;
  totalDuration: number;
}

interface WeeklyRankedUser {
  account: Account;
  activities: Activity[];
  consectutiveDays: number;
  totalDuration: number;
}

async function getData() {
  const challengId = process.env.CHALLENGE_ID;
  const token = process.env.TOKEN;

  if (!token) {
    return [];
  }

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

  if (!res.ok) {
    return [];
  }

  const data: {
    data: Activity[];
  } = await res.json();

  return data.data;
}

const UserRankTile = ({ user, index }: { user: RankedUser; index: number }) => {
  const isWinner = index === 0;

  return (
    <div
      key={user.account.id}
      className="grid grid-cols-[30px_1fr] items-center gap-2"
    >
      <p className={twMerge(["font-bold", isWinner ? "text-xl" : "text-base"])}>
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
          <p className="font-bold text-lg">{user.points} Pontos</p>
          <p className="text-xs">{user.consectutiveDays} Dias únicos</p>
          <p className="text-xs">{user.totalDuration} minutos</p>
        </div>
      </div>
    </div>
  );
};

export default async function Home() {
  const data = await getData();

  if (!data.length) {
    return <Error />;
  }

  function getConsecutiveDays(activities: Activity[]) {
    let days = 0;

    let previousDay: number;
    activities.forEach((activity) => {
      const currentDay = moment(activity.occurred_at).day();
      if (currentDay !== previousDay) {
        days += 1;
        previousDay = currentDay;
      }
    });

    return days;
  }

  function getAllActivitiesDuration(activities: Activity[]) {
    const duration = activities.reduce((acc, activity) => {
      acc += activity.duration;

      return acc;
    }, 0);

    return duration;
  }

  function orderWeeklyRanking(a: WeeklyRankedUser, b: WeeklyRankedUser) {
    if (a.activities.length > b.activities.length) {
      return -1;
    }
    if (a.activities.length < b.activities.length) {
      return 1;
    }

    // consectutive days
    if (a.consectutiveDays > b.consectutiveDays) {
      return -1;
    }
    if (a.consectutiveDays < b.consectutiveDays) {
      return 1;
    }

    // duration
    if (a.totalDuration > b.totalDuration) {
      return -1;
    }
    if (a.totalDuration < b.totalDuration) {
      return 1;
    }

    return 0;
  }

  function orderRanking(a: RankedUser, b: RankedUser) {
    if (a.points > b.points) {
      return -1;
    }
    if (a.points < b.points) {
      return 1;
    }

    // consectutive days
    if (a.consectutiveDays > b.consectutiveDays) {
      return -1;
    }
    if (a.consectutiveDays < b.consectutiveDays) {
      return 1;
    }

    // duration
    if (a.totalDuration > b.totalDuration) {
      return -1;
    }
    if (a.totalDuration < b.totalDuration) {
      return 1;
    }

    return 0;
  }

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

  function getWeeklyRanking(weeksActivities: {
    [key: string]: {
      [key: string]: UserActivities;
    };
  }) {
    return Object.keys(weeksActivities).reduce(
      (
        weeksAcc: {
          [key: string]: WeeklyRankedUser[];
        },
        key
      ) => {
        const week = weeksActivities[key];
        const users = Object.keys(week).reduce(
          (acc: WeeklyRankedUser[], userId: string) => {
            const user = week[userId];
            const rankedUser: WeeklyRankedUser = {
              ...user,
              consectutiveDays: getConsecutiveDays(user.activities),
              totalDuration: getAllActivitiesDuration(user.activities),
            };
            acc.push(rankedUser);

            return acc;
          },
          []
        );

        const orderedUsersByActivitiesNumber = users.sort(orderWeeklyRanking);

        weeksAcc[key] = orderedUsersByActivitiesNumber;

        return weeksAcc;
      },
      {}
    );
  }

  function getOverallUsersPoints(
    rankingByWeek: typeof weeklyRanking,
    top: number = 3
  ) {
    const points: {
      [key: string]: RankedUser;
    } = {};

    Object.values(rankingByWeek).forEach((week) => {
      week.forEach(({ account, activities }, index) => {
        // // only the first TOP makes points
        const potuation = top - index >= 0 ? top - index : 0;
        const consectutiveDays = getConsecutiveDays(activities);
        const allActivitiesDuration = getAllActivitiesDuration(activities);

        if (points[account.id]) {
          points[account.id] = {
            ...points[account.id],
            points: points[account.id].points + potuation,
            consectutiveDays:
              points[account.id].consectutiveDays + consectutiveDays,
            totalDuration:
              points[account.id].totalDuration + allActivitiesDuration,
          };
        } else {
          points[account.id] = {
            account: account,
            points: potuation,
            consectutiveDays: consectutiveDays,
            totalDuration: allActivitiesDuration,
          };
        }
      });
    });

    return points;
  }

  const weeks = groupByWeek(data);
  const weeksActivitiesByUser = groupWeeksActivitiesByUser(weeks);

  const weeklyRanking = getWeeklyRanking(weeksActivitiesByUser);

  return (
    <main className="p-10">
      <div className="grid grid-cols-1 md:grid-cols-3 justify-center gap-y-10 gap-x-10">
        <div>
          <h2 className="text-2xl font-bold text-center">
            Ranking Geral - Top 3 pontuam
          </h2>
          <div className="flex flex-col gap-2 max-w-sm mx-auto mt-5">
            {Object.values(getOverallUsersPoints(weeklyRanking))
              .sort(orderRanking)
              .map((user, index) => {
                return (
                  <UserRankTile key={user.account.id} {...{ user, index }} />
                );
              })}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-center">
            Ranking Geral - Top 4 pontuam
          </h2>
          <div className="flex flex-col gap-2 max-w-sm mx-auto mt-5">
            {Object.values(getOverallUsersPoints(weeklyRanking, 4))
              .sort(orderRanking)
              .map((user, index) => {
                return (
                  <UserRankTile key={user.account.id} {...{ user, index }} />
                );
              })}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-center">
            Ranking Geral - Top 5 pontuam
          </h2>
          <div className="flex flex-col gap-2 max-w-sm mx-auto mt-5">
            {Object.values(getOverallUsersPoints(weeklyRanking, 5))
              .sort(orderRanking)
              .map((user, index) => {
                return (
                  <UserRankTile key={user.account.id} {...{ user, index }} />
                );
              })}
          </div>
        </div>
      </div>
      <h2 className="text-4xl font-bold mt-10">Ranking Semanal</h2>
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
                            <p className="text-xs">
                              {user.consectutiveDays} Dias únicos
                            </p>
                            <p className="text-xs">
                              {user.totalDuration} minutos
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
