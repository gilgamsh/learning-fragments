/*
 * @Author: your name
 * @Date: 2021-12-08 23:50:12
 * @LastEditTime: 2022-02-15 01:00:00
 * @LastEditors: Juan Jiang
 * @Description: 对于一些有序的数，找到其之后第一个比它大的数 数组中的数按序进栈 如果被更新则出战 保证制备跟新一次
 * @FilePath: \learning-fragments\单调栈.cpp
 */
#include <bits/stdc++.h>
using namespace std;
int main()
{
    ios::sync_with_stdio(false);
    int n;
    cin >> n;
    vector<int> V(n + 1), ans(n + 1);
    for (int i = 1; i <= n; ++i)
        cin >> V[i];
    stack<int> S;
    for (int i = 1; i <= n; ++i)
    {
        while (!S.empty() && V[S.top()] < V[i])
        {
            ans[S.top()] = i;
            S.pop();
        }
        S.push(i);
    }
    for (int i = 1; i <= n; ++i)
        cout << ans[i] << " ";
    return 0;
}
