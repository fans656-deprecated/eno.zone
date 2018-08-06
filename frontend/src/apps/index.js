import Balance from './balance';
import Stock from './stock';
import Collection from './collection';
import Book from './book';
import BookShelf from './bookshelf';

const apps = {
  balance: Balance,
  book: Book,
  stock: Stock,
  collection: Collection,
  'book-shelf': BookShelf,
};
export default apps;
