# Helpful User Module

> System for adding and managing points for users.

### Usage:

Users can receive points, and once they exceed a certain amount of points, which is set as the `HELPFUL_ROLE_POINT_THRESHOLD` environmental variable, will receive the `Helpful` role.

The way points can be given out are:

1. Reacting to a message
2. "Thanking" the user

Users can receive multiple points per day.

##### 1. Reacting to a message:

For a point to be awarded to a user, the reaction emoji has to be one of the following:

1. `✅`
2. `✔️`
3. `☑️`
4. `🆙`
5. `⬆️`
6. `⏫`
7. `🔼`

##### 2. "Thanking" the user

If any message contains one of the abbreviations listed below, and a user mention, the module will add a point to the user being mentioned.

For example, if the user `Test#0000 - Test in further correspondence` has provided a solution which helped another user, that person can "thank" `Test` by sending a message in the channel which looks something along the lines of this:

`Thanks for the help, @Test#0000`

The example above is one of the many ways you can "thank" a user.

For confirmation sake, the bot will send out a message in the channel stating that you, as the user, have "thanked" `Test`.

### Commands:

This module introduces two commands:

1. `!points` - Tells you how many points you have accumulated.
2. `!leaderboard` - Displays the top 10 helpful users.

### Admin:

For administrative purposes, flags have been added to the `!points` command. These are only usable by users that have either the `Moderator` or the `Admin` role, hence the introduction of the `MOD_ROLE_ID` and `ADMIN_ROLE_ID` environmental variables.

The `!decay` command, along with it's own flag has been added for administrative purposes to the module.

1. `!points check <USER_ID || MENTION>` - Displays the amount of points the user has accumulated.
2. `!points reset <USER_ID || MENTION>` - Resets the user's points back to 0.
3. `!points set <USER_ID || MENTION> <AMOUNT_OF_POINTS>` - Manually set the amount of points to a user.
4. `!decay` - Tells the time when the next point decay will occur.
5. `!decay force` - Forces a point decay to occur.