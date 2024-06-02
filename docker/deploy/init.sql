create table if not exists users
(
    user_id    bigint auto_increment,
    username   varchar(255) not null,
    password   char(60)     not null,
    nickname   varchar(30) default '',
    avatar     text,
    enabled    bool        default false,
    created_at timestamp,
    updated_at timestamp,
    primary key (user_id),
    unique (username)
);

create table if not exists chat_rooms
(
    room_id    bigint auto_increment,
    name       varchar(50) default null,
    created_at timestamp,
    updated_at timestamp,
    primary key (room_id),
    unique (name)
);

create table if not exists chat_groups
(
    group_id   bigint auto_increment,
    owner_id   bigint      not null,
    room_id    bigint      not null,
    name       varchar(50) not null,
    avatar     text,
    created_at timestamp,
    updated_at timestamp,
    primary key (group_id),
    foreign key (owner_id) references users (user_id)
);

create table if not exists group_members
(
    id         bigint auto_increment,
    group_id   bigint not null,
    user_id    bigint not null,
    created_at timestamp,
    updated_at timestamp,
    primary key (id),
    foreign key (group_id) references chat_groups (group_id),
    foreign key (user_id) references users (user_id),
    unique (group_id, user_id)
);

create table if not exists contact_requests
(
    id          bigint auto_increment,
    request_uid bigint   not null,
    user_id     bigint,
    status      smallint not null default 0,
    expired_at  timestamp,
    created_at  timestamp,
    updated_at  timestamp,
    primary key (id),
    foreign key (request_uid) references users (user_id),
    foreign key (user_id) references users (user_id)
);

create table if not exists contacts
(
    contact_id       bigint auto_increment,
    owner_id         bigint,
    user_id          bigint,
    group_id         bigint,
    room_id          bigint,
    status           smallint not null default 0,
    last_msg_id      bigint,
    last_msg_time    timestamp,
    last_msg_content varchar(100),
    created_at       timestamp,
    updated_at       timestamp,
    primary key (contact_id),
    foreign key (owner_id) references users (user_id),
    foreign key (user_id) references users (user_id),
    foreign key (group_id) references chat_groups (group_id),
    foreign key (room_id) references chat_rooms (room_id),
    unique (owner_id, user_id, group_id)
);

create table if not exists chat_messages
(
    message_id bigint auto_increment,
    room_id    bigint   not null,
    sender_id  bigint   not null,
    type       smallint not null default 0,
    text       text,
    image      text,
    thumbnail  text,
    call_id    bigint,
    revoked    bool              default false,
    created_at timestamp,
    updated_at timestamp,
    primary key (message_id),
    foreign key (room_id) references chat_rooms (room_id),
    foreign key (sender_id) references users (user_id)
);

create table if not exists message_deliveries
(
    id          bigint auto_increment,
    message_id  bigint   not null,
    receiver_id bigint   not null,
    status      smallint not null default 0,
    created_at  timestamp,
    updated_at  timestamp,
    primary key (id),
    foreign key (message_id) references chat_messages (message_id),
    foreign key (receiver_id) references users (user_id)
);

create table if not exists calls
(
    call_id    bigint auto_increment,
    caller_id  bigint   not null,
    message_id bigint   not null,
    members    text,
    status     smallint not null default 0,
    start_time timestamp,
    end_time   timestamp,
    end_reason smallint          default 0,
    created_at timestamp,
    updated_at timestamp,
    primary key (call_id),
    foreign key (caller_id) references users (user_id),
    foreign key (message_id) references chat_messages (message_id)
);

create table if not exists user_settings
(
    user_id   bigint not null,
    wallpaper text,
    created_at timestamp,
    updated_at timestamp,
    primary key (user_id),
    foreign key (user_id) references users (user_id)
);