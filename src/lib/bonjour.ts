import bonjour from 'bonjour';
import pkg from '../../package.json';

const bonjourInstance = bonjour();
const id = pkg.name;

interface IBonjourService extends bonjour.Service {
  addresses: string[];
}

export const findService = (
  suffix: string,
  timeout = 5000
): Promise<IBonjourService | null> =>
  new Promise(resolve => {
    setTimeout(() => resolve(null), timeout);
    return bonjourInstance.find({ type: `${id}-${suffix}` }, service =>
      resolve(service as IBonjourService)
    );
  });

export const publishService = (suffix: string) =>
  bonjourInstance.publish({ name: id, type: `${id}-${suffix}`, port: 3000 });
