import HelpfulRoleMemberModel from './db_model';

import { IUser } from '.';

export default async (userID: string) => {
  let user: IUser = await HelpfulRoleMemberModel.findOne({
    user: userID,
  });
  if (!user)
    user = await HelpfulRoleMemberModel.create({
      user: userID,
    });

  // Add a point to the user
  user.points++;

  // Save the user
  user
    .save()
    .then(updated => console.log(`${updated.id} => ${updated.points}`))
    .catch(error => console.error('user.save():', error));
};
