DROP TABLE IF EXISTS accounts CASCADE;
CREATE TABLE accounts (
id serial NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  token text NOT NULL,
  accounttype integer NOT NULL,
  postingToken text NOT NULL
);

INSERT INTO accounts (id, email, password, token, accounttype, postingToken) VALUES
(1, 'test@test.com', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'test@test.com | 580e2db6b34c9580e2db6b34e5580e2db6b350a', 1, 'p1');


DROP TABLE IF EXISTS answers CASCADE;
CREATE TABLE answers (
id serial NOT NULL,
  qid integer NOT NULL,
  answer text NOT NULL,
  date text NOT NULL,
  uid text NOT NULL,
  pagenumber integer NOT NULL
);

DROP TABLE IF EXISTS course CASCADE;
CREATE TABLE course (
id serial NOT NULL,
  name text NOT NULL,
  instructor_id INT NOT NULL
);

DROP TABLE IF EXISTS material CASCADE;
CREATE TABLE material (
id serial NOT NULL,
  cid integer NOT NULL,
  filepath text NOT NULL,
  filename text NOT NULL,
  cui text NOT NULL,
  numquestions integer NOT NULL DEFAULT '0',
  pagenumber integer NOT NULL
);

DROP TABLE IF EXISTS questions CASCADE;
CREATE TABLE questions (
id serial NOT NULL,
  uid text,
  question text,
  writer text,
  date text NOT NULL,
  numanswers integer NOT NULL,
  pagenumber integer NOT NULL
);
