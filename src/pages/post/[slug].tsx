import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const estimatedReadTime = useMemo(() => {
    if (router.isFallback) return 0;

    const wordsPerMinute = 200;

    const contentWords = post.data.content.reduce(
      (summedContents, currentContent) => {
        const headingWords = currentContent.heading.split(/\s/g).length;
        const bodyWords = currentContent.body.reduce(
          (summedBodies, currentBody) => {
            const textWords = currentBody.text.split(/\s/g).length;
            return summedBodies + textWords;
          },
          0
        );
        return summedContents + headingWords + bodyWords;
      },
      0
    );

    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);

    return readTime;
  }, [post, router.isFallback]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <main>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>
        <article className={`${commonStyles.container} ${styles.post}`}>
          <h1>{post.data.title}</h1>
          <div>
            <time>
              <FiCalendar />
              {post.first_publication_date}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <time>
              <FiClock />
              {estimatedReadTime} min
            </time>
          </div>

          {post.data.content.map(post => (
            <section key={post.heading} className={styles.postContent}>
              <h1>{post.heading}</h1>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(post.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: response.data,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
