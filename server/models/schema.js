let query = require('../db');

module.exports = async () => {
  var querytext = `CREATE TABLE IF NOT EXISTS
    users (
      id UUID NOT NULL PRIMARY KEY,
      email VARCHAR NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL UNIQUE,
      password VARCHAR(200),
      isVerified BOOL DEFAULT true NOT NULL,
      profilePic VARCHAR(200) default '`+process.env.REACT_HOST+ `/defaultPic.png'`+`,
      created_date TIMESTAMP DEFAULT NOW() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS
    product (
      id UUID NOT NULL PRIMARY KEY,
      name VARCHAR(200) UNIQUE,
      is_available BOOL DEFAULT true NOT NULL,
      original_price DECIMAL(15,2) NOT NULL,
      discounted_price DECIMAL(15,2) NOT NULL,
      rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
      created_date TIMESTAMP DEFAULT NOW() NOT NULL,
      warranty VARCHAR(500) NOT NULL,
      uploaded_by UUID NOT NULL,
      FOREIGN KEY(uploaded_by) REFERENCES users
    );
    CREATE TABLE IF NOT EXISTS
    product_images (
      pid UUID NOT NULL,
      image_url VARCHAR(200) NOT NULL,
      created_date TIMESTAMP DEFAULT NOW() NOT NULL,
      FOREIGN KEY(pid) REFERENCES product
    );
    CREATE TABLE IF NOT EXISTS
    product_thumb_image (
      pid UUID NOT NULL,
      image_url VARCHAR(200) NOT NULL,
      created_date TIMESTAMP DEFAULT NOW() NOT NULL,
      FOREIGN KEY(pid) REFERENCES product
    );
    CREATE TABLE IF NOT EXISTS
    product_features (
      pid UUID NOT NULL,
      heading VARCHAR(50) NOT NULL,
      feature VARCHAR(500) NOT NULL,
      created_date TIMESTAMP DEFAULT NOW() NOT NULL,
      FOREIGN KEY(pid) REFERENCES product
    );
    CREATE TABLE IF NOT EXISTS
    product_tech_detail (
      pid UUID NOT NULL,
      head VARCHAR(100),
      tail VARCHAR(100),
      FOREIGN KEY(pid) REFERENCES product
    )`
  return await query(querytext);
}
