import webpack from 'webpack';
import { Observable } from 'rxjs';

export function runWebpack(config: webpack.Configuration): Observable<webpack.Stats> {
  return new Observable(subscriber => {
    // Passing `watch` option here will result in a warning due to missing callback.
    // We manually call `.watch` or `.run` later so this option isn't needed here.
    const { watch, ...normalizedConfig } = config;
    const webpackCompiler = webpack(normalizedConfig);

    const callback = (err: Error | null, stats?: webpack.Stats) => {
      if (err) {
        subscriber.error(err);
        return;
      }
      if (stats) {
        subscriber.next(stats);
      }
    };

    if (watch) {
      const watchOptions = config.watchOptions || {};
      const watching = webpackCompiler.watch(watchOptions, callback);

      return () => watching.close(() => subscriber.complete());
    } else {
      webpackCompiler.run((err, stats) => {
        callback(err, stats);

        webpackCompiler.close(closeErr => {
          if (closeErr) subscriber.error(closeErr);
          subscriber.complete();
        });
      });

      return () => {
        // No cleanup needed for single run
      };
    }
  });
}
