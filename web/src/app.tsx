// 运行时配置

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://next.umijs.org/docs/api/runtime-config#getinitialstate
import { ConfigProvider, theme } from 'antd';

export async function getInitialState(): Promise<{ name: string }> {
  return { name: '@umijs/max' };
}

// export const layout = () => {
//   return {
//     layout: 'top',
//     fixedHeader: true,
//     headerRender: false,
//     menuHeaderRender: false,
//     footerRender: false,
//   };
// };

export function rootContainer(container: React.ReactElement) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      {container}
    </ConfigProvider>
  );
}
