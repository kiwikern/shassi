class UpdatesFormatter {

  static format(updates) {
    return `
<h1>New Product Updates</h1>
<table>
  <tr>
    <th>Product</th>  
    <th>Store</th>  
    <th>Size</th>  
    <th>Price</th>  
    <th>Size Available</th>
    ${this.formatAll(updates)}
  </tr>
</table>
    `
  }

  static formatAll(updates) {
    return updates.map(update => this.formatOne(update))
      .reduce((t1, t2) => t1 + t2, '');
  }

  static formatOne(update) {
    return `
<tr>
    <td><a href="${update.product.url}">${update.product.name}</a></td>
    <td>${update.product.store}</td>
    <td>${update.product.size.name ? update.product.size.name : 'n/a'}</td>
    <td>${this.formatUpdateChange(update, 'price')}</td>
    <td>${this.formatUpdateChange(update, 'isAvailable')}</td>
</tr>`
  }

  static formatUpdateChange(update, property) {
    const oldValue = update.old[property];
    const newValue = update.new[property];
    if (typeof newValue === 'undefined') {
      return 'n/a';
    }else if (oldValue && oldValue !== newValue) {
      return `<del>${oldValue}</del> -> <b>${newValue}</b>`;
    } else {
      return newValue;
    }
  }
}

module.exports = UpdatesFormatter;