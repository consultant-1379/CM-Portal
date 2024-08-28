import { core } from '../../modules/core/client/core.client.module';
import { users } from '../../modules/users/client/users.client.module';
import { roles } from '../../modules/roles/client/roles.client.module';
import { schemas } from '../../modules/schemas/client/schemas.client.module';
import { requests } from '../../modules/requests/client/requests.client.module';
import { productsUpdate } from '../../modules/products_update/client/products_update.client.module';
import { tokens } from '../../modules/tokens/client/tokens.client.module';
import { programs } from '../../modules/programs/client/programs.client.module';
import { configurationFiles } from '../../modules/configuration_files/client/configuration_files.client.module';
import { products } from '../../modules/products/client/products.client.module';
import { history } from '../../modules/history/client/history.client.module';

export default [
  core,
  users,
  roles,
  schemas,
  requests,
  productsUpdate,
  tokens,
  configurationFiles,
  programs,
  products,
  history
];
