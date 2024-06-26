const fs = require('fs');
const path = require('path');

// 从JSON文件读取并插入publications_categories表的数据
function createCategoriesInitialData(db) {
  const categoriesFilePath = path.join(process.cwd(), 'server/config/initData/publications_category.json');
  fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading categories JSON file:', err);
      return;
    }
    const categories = JSON.parse(data).category;
    categories.forEach(category => {
      db.run(`
        INSERT INTO publications_categories (name, category_order)
        VALUES (?, ?)
      `, [category.name, category.category_order], (err) => {
        if (err) {
          console.error('Error inserting data into publications_categories table:', err);
        }
      });
    });
  });
}
  // 从JSON文件读取并插入publications_items表的数据
  function createItemsInitialData(db) {
    const itemsFilePath = path.join(process.cwd(), 'server/config/initData/publications_item.json');
    fs.readFile(itemsFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading items JSON file:', err);
        return;
      }
      const sections = JSON.parse(data).sections;
      sections.forEach(section => {
        const categoryName = section.category;
        
        db.get(`
          SELECT id FROM publications_categories WHERE name = ?
        `, [categoryName], (err, row) => {
          if (err) {
            console.error('Error querying publications_categories table:', err);
            return;
          }
          
          if (!row) {
            console.error(`Category name "${categoryName}" not found in publications_categories table.`);
            return;
          }
          
          const categoryId = row.id;
          section.items.forEach(item => {
            db.run(`
              INSERT INTO publications_items (category_id, content)
              VALUES (?, ?)
            `, [categoryId, JSON.stringify(item)], (err) => {
              if (err) {
                console.error('Error inserting data into publications_items table:', err);
              }
            });
          });
        });
      });
    });
  }
  
  module.exports = {
    createItemsInitialData,
    createCategoriesInitialData
  };
  