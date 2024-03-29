import io from "socket.io-client";
import { apiSlice } from "../api/apiSlice";

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: (id) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
      transformResponse(apiResponse, meta) {
        const totalCount = meta.response.headers.get("X-Total-Count");
        return {
          data: apiResponse,
          totalCount,
        };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        // create socket
        const socket = io("https://json-chat-app-server.herokuapp.com", {
          reconnectionDelay: 1000,
          reconnection: true,
          reconnectionAttemps: 10,
          transports: ["websocket"],
          agent: false,
          upgrade: false,
          rejectUnauthorized: false,
        });

        try {
          await cacheDataLoaded;
          socket.on("messages", (data) => {
            if (Number(arg) === Number(data?.data?.conversationId)) {
              updateCachedData((draft) => {
                if (
                  data.data.id &&
                  draft.data.findIndex(
                    (prev) => Number(prev.id) === Number(data.data.id)
                  ) === -1
                ) {
                  draft.data.unshift(data?.data);
                }
              });
            }
          });
        } catch (err) {}

        await cacheEntryRemoved;
        socket.close();
      },
    }),
    getMoreMessages: builder.query({
      query: ({ id, page }) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
      async onQueryStarted({ id }, { queryFulfilled, dispatch }) {
        try {
          const messages = await queryFulfilled;
          if (messages?.data?.length > 0) {
            // update message cache pessimistically start
            dispatch(
              apiSlice.util.updateQueryData("getMessages", id, (draft) => {
                // Duplicate value filter
                const filteredData = messages.data.filter(
                  (value) =>
                    draft.data.findIndex(
                      (prev) => Number(prev.id) === Number(value.id)
                    ) === -1
                );

                return {
                  data: [...draft.data, ...filteredData],
                  totalCount: Number(draft.totalCount),
                };
              })
            );
            // update messages cache pessimistically end
          }
        } catch (err) {}
      },
    }),
    addMessage: builder.mutation({
      query: (data) => ({
        url: "/messages",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useGetMessagesQuery, useAddMessageMutation } = messagesApi;
