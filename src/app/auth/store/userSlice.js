/* eslint import/no-extraneous-dependencies: off */
import { createSlice } from '@reduxjs/toolkit';
import firebase from 'firebase/app';
import 'firebase/auth';
import history from '@history';
import _ from '@lodash';
import { setInitialSettings, setDefaultSettings } from 'app/store/fuse/settingsSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
import firebaseService from 'app/services/firebaseService';



export const setUserDataFirebase = (user, authUser) => async (dispatch) => {
  if (
    user &&
    user.data &&
    user.data.settings &&
    user.data.settings.theme &&
    user.data.settings.layout &&
    user.data.settings.layout.style
  ) {
    // Set user data but do not update
    return dispatch(setUserData(user));
  }

  // Create missing user settings
  return dispatch(createUserSettingsFirebase(authUser));
};

export const createUserSettingsFirebase = (authUser) => async (dispatch, getState) => {
  const guestUser = getState().auth.user;
  const fuseDefaultSettings = getState().fuse.settings.defaults;
  const { currentUser } = firebase.auth();

  /**
   * Merge with current Settings
   */
  const user = _.merge({}, guestUser, {
    uid: authUser.uid,
    from: 'firebase',
    role: ['admin'],
    data: {
      displayName: authUser.displayName,
      email: authUser.email,
      photoURL: 'assets/images/avatars/Velazquez.jpg', 
      name: authUser.displayName, 
      settings: { ...fuseDefaultSettings },
    },
    status: 'online',
    mood: "it's a status....not your diary...",
    chatList: [
      {
        chatId: '1725a680b3249760ea21de52',
        contactId: '5725a680b3249760ea21de52',
        lastMessageTime: '2021-06-12T02:10:18.931Z'
      },
      {
        chatId: '2725a680b8d240c011dd2243',
        contactId: '5725a680606588342058356d',
        lastMessageTime: '2021-02-18T10:30:18.931Z'
      },
      {
        chatId: '3725a6809413bf8a0a5272b4',
        contactId: '5725a68009e20d0a9e9acf2a',
        lastMessageTime: '2021-03-18T12:30:18.931Z'
      }
    ],
    contacts: [
      {
        starred: [
          '5725a680ae1ae9a3c960d487',
          '5725a6801146cce777df2a08',
          '5725a680bbcec3cc32a8488a',
          '5725a680bc670af746c435e2',
          '5725a68009e20d0a9e9acf2a'
        ],
        frequentContacts: [
          '5725a6809fdd915739187ed5',
          '5725a68031fdbb1db2c1af47',
          '5725a680606588342058356d',
          '5725a680e7eb988a58ddf303',
          '5725a6806acf030f9341e925',
          '5725a68034cb3968e1f79eac',
          '5725a6801146cce777df2a08',
          '5725a680653c265f5c79b5a9'
        ],
        groups: [
          {
            id: '5725a6802d10e277a0f35739',
            name: 'Friends',
            contactIds: ['5725a680bbcec3cc32a8488a', '5725a680e87cb319bd9bd673', '5725a6802d10e277a0f35775']
          },
          {
            id: '5725a6802d10e277a0f35749',
            name: 'Clients',
            contactIds: [
              '5725a680cd7efa56a45aea5d',
              '5725a68018c663044be49cbf',
              '5725a6809413bf8a0a5272b1',
              '5725a6803d87f1b77e17b62b'
            ]
          },
          {
            id: '5725a6802d10e277a0f35329',
            name: 'Recent Workers',
            contactIds: [
              '5725a680bbcec3cc32a8488a',
              '5725a680653c265f5c79b5a9',
              '5725a6808a178bfd034d6ecf',
              '5725a6801146cce777df2a08'
            ]
          }
        ]
      }
    ]
  });
  currentUser.updateProfile(user.data);

  dispatch(updateUserData(user));

  return dispatch(setUserData(user));
};

export const setUserData = (user) => async (dispatch, getState) => {
  /*
        You can redirect the logged-in user to a specific route depending on his role
         */

  history.location.state = {
    // redirectUrl: user.redirectUrl, // for example 'apps/academy'
    redirectUrl: 'pages/profile'
  };

  /*
    Set User Settings
     */
  dispatch(setDefaultSettings(user.data.settings));

  dispatch(setUser(user));
};

export const updateUserSettings = (settings) => async (dispatch, getState) => {
  const oldUser = getState().auth.user;
  const user = _.merge({}, oldUser, { data: { settings } });

  dispatch(updateUserData(user));

  return dispatch(setUserData(user));
};

export const updateUserShortcuts = (shortcuts) => async (dispatch, getState) => {
  const { user } = getState().auth;
  const newUser = {
    ...user,
    data: {
      ...user.data,
      shortcuts,
    },
  };

  dispatch(updateUserData(user));

  return dispatch(setUserData(newUser));
};

export const logoutUser = () => async (dispatch, getState) => {
  const { user } = getState().auth;

  if (!user.role || user.role.length === 0) {
    // is guest
    return null;
  }

  history.push({
    pathname: '/',
  });

  switch (user.from) {
    case 'firebase': {
      firebaseService.signOut();
      break;
    }
  }

  dispatch(setInitialSettings());

  return dispatch(userLoggedOut());
};

export const updateUserData = (user) => async (dispatch, getState) => {
  if (!user.role || user.role.length === 0) {
    // is guest
    return;
  }
  switch (user.from) {
    case 'firebase': {
      firebaseService
        .updateUserData(user)
        .then(() => {
          dispatch(showMessage({ message: 'User data saved to firebase' }));
        })
        .catch((error) => {
          dispatch(showMessage({ message: error.message }));
        });
      break;
    }
  }
};

const initialState = {
  role: [], // guest
  data: {
    displayName: 'John Doe',
    photoURL: 'assets/images/avatars/Velazquez.jpg',
    email: 'johndoe@withinpixels.com',
    shortcuts: ['calendar', 'mail', 'contacts', 'todo']
  },
};

const userSlice = createSlice({
  name: 'auth/user',
  initialState,
  reducers: {
    setUser: (state, action) => action.payload,
    userLoggedOut: (state, action) => initialState,
  },
  extraReducers: {},
});

export const { setUser, userLoggedOut } = userSlice.actions;

export default userSlice.reducer;
