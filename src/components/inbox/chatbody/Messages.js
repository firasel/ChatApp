import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
    messagesApi,
    useGetMessagesQuery
} from "../../../features/messages/messagesApi";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Message from "./Message";

export default function Messages({ messages = [] }) {
  const { user } = useSelector((state) => state.auth) || {};
  const { email } = user || {};
  const { id } = useParams();
  const { data } = useGetMessagesQuery(id) || {};
  const { totalCount } = data || {};
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dispatch = useDispatch();

  const fetchMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  useEffect(() => {
    if (page > 1 && hasMore) {
      dispatch(
        messagesApi.endpoints.getMoreMessages.initiate({
          id,
          page,
        })
      );
    }
  }, [page, id, dispatch, hasMore]);

  useEffect(() => {
    if (totalCount > 0) {
      const more =
        Math.ceil(
          totalCount / Number(process.env.REACT_APP_MESSAGES_PER_PAGE)
        ) > page;
      setHasMore(more);
    }
  }, [totalCount, page]);

  return (
    <div className="relative w-full h-[calc(100vh_-_197px)] py-6 flex flex-col-reverse">
      <ul id="scrollableDiv" className="space-y-2">
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMore}
          hasMore={hasMore}
          inverse={true}
          loader={<LoadingSpinner />}
          style={{ display: "flex", flexDirection: "column-reverse" }}
          height={window.innerHeight - 230}
          scrollableTarget="scrollableDiv"
          refreshFunction={fetchMore}
          pullDownToRefresh
          pullDownToRefreshThreshold={20}
          className="!overflow-y-auto"
        >
          {messages
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((message) => {
              const { message: lastMessage, id, sender } = message || {};

              const justify = sender.email !== email ? "start" : "end";

              return (
                <Message key={id} justify={justify} message={lastMessage} />
              );
            })}
        </InfiniteScroll>
      </ul>
    </div>
  );
}
