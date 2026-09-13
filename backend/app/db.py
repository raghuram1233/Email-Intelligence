from neo4j import GraphDatabase
from app import config


class Database:
    _driver = None

    @classmethod
    def driver(cls):
        if cls._driver is None:
            cls._driver = GraphDatabase.driver(
                config.NEO4J_URI, auth=(config.NEO4J_USER, config.NEO4J_PASSWORD)
            )
        return cls._driver

    @classmethod
    def close(cls):
        if cls._driver is not None:
            cls._driver.close()
            cls._driver = None

    @classmethod
    def read(cls, query, **params):
        with cls.driver().session() as session:
            return list(session.run(query, **params))

    @classmethod
    def write(cls, query, **params):
        with cls.driver().session() as session:
            return list(session.execute_write(lambda tx: list(tx.run(query, **params))))
