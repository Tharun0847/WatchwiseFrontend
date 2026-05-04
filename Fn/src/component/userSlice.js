import { createSlice } from "@reduxjs/toolkit";

const storedUser = window.localStorage.getItem("user");
const initialState = {
  user: storedUser ? JSON.parse(storedUser) : {},
};

export const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    updateUser: (state, action) => {
      state.user = { ...action.payload };
    },
  },
});

export const { updateUser } = userSlice.actions;
const userReducer = userSlice.reducer;
export default userReducer;
